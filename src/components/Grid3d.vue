<script setup>
import { useSlots, ref, shallowRef, watch, onMounted, onBeforeUnmount, computed } from "vue";
import {
    Plane,
    Vector3,
    Scene,
    Color,
    PerspectiveCamera,
    WebGLRenderer,
    PCFSoftShadowMap,
    DirectionalLight,
    AmbientLight,
    PlaneGeometry,
    MeshStandardMaterial,
    MeshBasicMaterial,
    Mesh,
    DoubleSide,
    Group,
    Raycaster,
    Vector2,
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
    LineSegments,
    BoxGeometry,
    TextureLoader,
    RepeatWrapping,
    SRGBColorSpace,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    CSS2DRenderer,
    CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { convertColorToHex } from "../lib";
import { canPlace, editFootprint } from "../lib/grid3d-edit";
import { resolveGridIcon } from "../lib/grid-icon";

const emit = defineEmits([
    "change",
    "triggerAction",
    "delete",
    "hoverSquare",
    "hoverItem",
    "selectItem",
    "unselect",
]);

const props = defineProps({
    items: {
        type: Array,
        default: () => [],
    },
    activeEntity: {
        type: Object,
        default: () => ({}),
    },
    config: {
        type: Object,
        default: () => ({}),
    },
    readonly: {
        type: Boolean,
        default: false,
    },
});

const width = ref(props.config.gridWidth);
const height = ref(props.config.gridHeight);

const container = ref(null);
const canvas = ref(null);
const deleteButton = shallowRef(null);
const iconTargets = shallowRef([]);
const slots = useSlots();
let scene, camera, renderer, css2dRenderer, css3dRenderer, controls, raycaster, mouse;
let frameId, resizeObserver;
let drag = null;
let gesture = null;
const editPlane = new Plane(new Vector3(0, 1, 0), 0);
const editPoint = new Vector3();
let gridHelper = null;
let hoverLabel = null;
let hoverCell = null;

function numberToLetters(num) {
    let letters = "";
    while (num > 0) {
        let remainder = (num - 1) % 26;
        letters = String.fromCharCode(65 + remainder) + letters;
        num = Math.floor((num - 1) / 26);
    }
    return letters;
}

const gridCoordinates = computed(() => {
    const abs = [];
    const ord = [];

    for (let i = 1; i <= props.config.gridWidth; i += 1) {
        if (props.config.abscissaType === "alphabetic") {
            abs.push(numberToLetters(i));
        } else {
            abs.push(i);
        }
    }
    for (let i = 1; i <= props.config.gridHeight; i += 1) {
        if (props.config.ordinatesType === "alphabetic") {
            ord.push(numberToLetters(i));
        } else {
            ord.push(i);
        }
    }

    return {
        abs,
        ord,
    };
});

function itemCoordinates(item) {
    if (!item) return null;
    if (item.h === 1 && item.w === 1) {
        return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]
            }`;
    }
    return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]
        }, ${gridCoordinates.value.abs[item.x + item.w - 1]
        }-${gridCoordinates.value.ord[item.y + item.h - 1]
        }`;
}

function createRectGrid(w, h, color) {
    const vertices = [];
    for (let x = 0; x <= w; x += 1) {
        const X = x - w / 2;
        vertices.push(X, 0, -h / 2,  X, 0, h / 2);
    }

    for (let z = 0; z <= h; z += 1) {
        const Z = z - h / 2;
        vertices.push(-w / 2, 0, Z,  w / 2, 0, Z);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute(
        "position",
        new Float32BufferAttribute(vertices, 3)
    );

    const material = new LineBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
    });

    const lines = new LineSegments(geometry, material);
    lines.position.y = 0;
    return lines;
}

function createWalls(w, h) {
    const thickness = props.config.boxThickness;
    const wallHeight = props.config.boxHeight;
    const color = props.config.boxColor;

    const walls = new Group();
    const material = new MeshStandardMaterial({
        color,
        metalness: 0.2,
        roughness: 0.8,
    });

    const left = new Mesh(
        new BoxGeometry(thickness, wallHeight, h + thickness * 2),
        material
    );
    left.position.set(-w / 2 - thickness / 2, wallHeight / 2, 0);
    left.userData = { isWall: true };

    const right = new Mesh(
        new BoxGeometry(thickness, wallHeight, h + thickness * 2),
        material
    );
    right.position.set(w / 2 + thickness / 2, wallHeight / 2, 0);
    right.userData = { isWall: true };

    const front = new Mesh(
        new BoxGeometry(w + thickness * 2, wallHeight, thickness),
        material
    );
    front.position.set(0, wallHeight / 2, -h / 2 - thickness / 2);
    front.userData = { isWall: true };

    const back = new Mesh(
        new BoxGeometry(w + thickness * 2, wallHeight, thickness),
        material
    );
    back.position.set(0, wallHeight / 2, h / 2 + thickness / 2);
    back.userData = { isWall: true };

    walls.add(left, right, front, back);
    return walls;
}

const textureLoader = new TextureLoader();
const textureCache = new Map();

function createTexture(textureConfig) {
    if (!textureConfig?.src) return null;
    const cacheKey = JSON.stringify(textureConfig);
    if (textureCache.has(cacheKey)) {
        return textureCache.get(cacheKey);
    }
    const texture = textureLoader.load(textureConfig.src);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(
        textureConfig.repeatX ?? 1,
        textureConfig.repeatY ?? 1
    );
    texture.rotation = textureConfig.rotation ?? 0;
    texture.center.set(0.5, 0.5);
    textureCache.set(cacheKey, texture);
    return texture;
}

function createItemMaterial(item) {
    const texture = createTexture(item.texture);
    return new MeshStandardMaterial({
        color: texture ? 0xffffff : item.color,
        map: texture,
        metalness: item.texture?.metalness ?? 0.7,
        roughness: item.texture?.roughness ?? 0.4,
    });
}

function createItemIcon(item) {
    if (props.config.showIcons === false) return null;
    const icon = resolveGridIcon(item.icon);
    if (!icon) return null;
    const color = item.iconColor || props.config.iconColor;
    const cacheKey = `icon:${JSON.stringify({ ...icon, color })}`;
    let texture = textureCache.get(cacheKey);
    if (!texture) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox', icon.viewBox);
        svg.setAttribute('width', '256');
        svg.setAttribute('height', '256');
        svg.setAttribute('color', color || '#ffffff');
        for (const path of icon.paths) {
            const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            element.setAttribute('d', path);
            element.setAttribute('fill', icon.fill);
            element.setAttribute('stroke', icon.stroke);
            element.setAttribute('stroke-width', String(icon.strokeWidth));
            element.setAttribute('stroke-linecap', 'round');
            element.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(element);
        }
        texture = textureLoader.load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.outerHTML)}`);
        texture.colorSpace = SRGBColorSpace;
        textureCache.set(cacheKey, texture);
    }
    const size = Math.min(1, item.w - 0.2, item.h - 0.2);
    const mesh = new Mesh(new PlaneGeometry(size, size), new MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, toneMapped: false,
        side: DoubleSide,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
        item.x + item.w / 2 - width.value / 2,
        (item.depth ?? 1) + 0.01,
        item.y + item.h / 2 - height.value / 2
    );
    return mesh;
}

const init3DScene = () => {
    scene = new Scene();
    scene.background = new Color(
        convertColorToHex(props.config.coordinatesBackground).slice(0, -2)
    );

    camera = new PerspectiveCamera(
        75,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, height.value, 12);
    camera.lookAt(0, 0, 0);

    renderer = new WebGLRenderer({ canvas: canvas.value, antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const light = new DirectionalLight(0xffffff, 1);
    light.position.set(5, 20, 7.5);
    light.castShadow = true;
    light.intensity = 4;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 20;
    light.shadow.camera.top = 20;
    light.shadow.camera.bottom = -20;

    scene.add(light);

    const ambientLight = new AmbientLight(0x404040);
    scene.add(ambientLight);

    gridHelper = createRectGrid(
        width.value,
        height.value,
        convertColorToHex(props.config.gridStroke).slice(0, -2)
    );

    scene.add(gridHelper);

    raycaster = new Raycaster();
    mouse = new Vector2();

    css3dRenderer = new CSS3DRenderer();
    css3dRenderer.setSize(container.value.clientWidth, container.value.clientHeight);
    Object.assign(css3dRenderer.domElement.style, {
        position: 'absolute', top: '0px', left: '0px', pointerEvents: 'none',
    });
    container.value.appendChild(css3dRenderer.domElement);
    css2dRenderer = new CSS2DRenderer();
    css2dRenderer.setSize(
        container.value.clientWidth,
        container.value.clientHeight
    );
    css2dRenderer.domElement.style.position = "absolute";
    css2dRenderer.domElement.style.top = "0px";
    css2dRenderer.domElement.style.pointerEvents = "none";
    container.value.appendChild(css2dRenderer.domElement);

    renderItems();
    addFloor();
    addWalls();
    animate();
};

function disposeObject(object) {
    object.traverse(child => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => material?.dispose());
        if (child.isCSS2DObject || child.isCSS3DObject) child.element.remove();
    });
}

const disposeScene = () => {
    clearHoverInfo();
    clearGridHover();
    cancelAnimationFrame(frameId);
    controls?.dispose();
    if (scene) {
        disposeObject(scene);
        scene.clear();
    }
    renderer?.dispose();
    css2dRenderer?.domElement.remove();
    css3dRenderer?.domElement.remove();
};

function addWalls() {
    if (props.config.showBox) {
        const walls = createWalls(width.value, height.value, props.config.box);
        scene.add(walls);
    }
}

const addFloor = () => {
    const floorGeometry = new PlaneGeometry(width.value, height.value);
    const floorMaterial = new MeshStandardMaterial({
        color: convertColorToHex(props.config.gridFill).slice(0, -2),
        side: DoubleSide,
        opacity: 0.5,
        transparent: true,
    });

    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;

    floor.userData = { isFloor: true };
    scene.add(floor);
};


const renderItems = () => {
    clearHoverInfo();
    clearGridHover();
    deleteButton.value = null;
    const SPACING = 0.1;

    while (scene.children.length > 3) {
        const child = scene.children[scene.children.length - 1];
        scene.remove(child);
        disposeObject(child);
    }

    const nextIconTargets = [];
    const displayItems = props.items.map(item => item.id === props.activeEntity?.id ? props.activeEntity : item);
    displayItems.forEach((item) => {
        if (item && item.w && item.h) {
            const geometry = new BoxGeometry(
                item.w - SPACING,
                item.depth ?? 1,
                item.h - SPACING
            );
            const material = createItemMaterial(item);

            if (props.activeEntity && item === props.activeEntity) {
                material.emissive = new Color(
                    convertColorToHex(props.config.gridHighlightColor).slice(0, -2)
                );
                material.emissiveIntensity = 0.5;

                const labelDiv = document.createElement("div");
                labelDiv.className = "grid-plan-grid-3d-label";
                labelDiv.textContent = `${props.activeEntity.description ?? ''} (${itemCoordinates(item)})`;
                labelDiv.style.color = props.config.tooltipColor;
                labelDiv.style.whiteSpace = 'nowrap';
                labelDiv.style.textShadow = '0 1px 3px #000000';
                const selectionDiv = document.createElement('div');
                selectionDiv.className = 'grid-plan-grid-3d-selection';
                const selectionContent = document.createElement('div');
                // CSS2DRenderer controls the outer element's display each frame.
                // Keep the centered layout on an inner element.
                selectionDiv.appendChild(selectionContent);
                Object.assign(selectionContent.style, {
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '8px', paddingBottom: '20px', pointerEvents: 'none',
                });
                const label = new CSS2DObject(selectionDiv);
                // Anchor the bottom of the entire control stack to the item.
                // Spacing stays in pixels as the camera rotates or zooms.
                label.center.set(0.5, 1);
                selectionDiv.style.pointerEvents = 'none';
                label.position.set(
                    item.x + item.w / 2 - width.value / 2,
                    item.depth ?? 1,
                    item.y + item.h / 2 - height.value / 2
                );
                scene.add(label);

                if (!props.readonly) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'grid-plan-grid-3d-delete';
                    button.setAttribute('aria-label', `Delete ${item.description ?? 'item'}`);
                    button.title = 'Delete item';
                    Object.assign(button.style, {
                        pointerEvents: 'auto', width: '28px', height: '28px',
                        display: 'grid', placeItems: 'center', padding: '0', flexShrink: '0',
                        border: '1px solid #ffffff66', borderRadius: '50%',
                        background: '#555555cc', color: '#ffffff',
                        cursor: 'pointer',
                    });
                    button.addEventListener('pointerdown', event => event.stopPropagation());
                    button.addEventListener('click', event => {
                        event.stopPropagation();
                        if (!props.readonly) emit('delete', item);
                    });
                    selectionContent.appendChild(button);
                    deleteButton.value = button;
                }
                selectionContent.appendChild(labelDiv);
            }

            const cube = new Mesh(geometry, material);
            cube.position.set(
                item.x + item.w / 2 - width.value / 2,
                (item.depth ?? 1) / 2,
                item.y + item.h / 2 - height.value / 2
            );
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.userData = item;

            scene.add(cube);
            const icon = createItemIcon(item);
            if (icon) scene.add(icon);
            else if (props.config.showIcons !== false && slots.componentIcon) {
                const target = document.createElement('div');
                target.className = 'grid-plan-grid-3d-component-icon';
                Object.assign(target.style, { width: '32px', height: '32px', backfaceVisibility: 'hidden' });
                const overlay = new CSS3DObject(target);
                overlay.rotation.x = -Math.PI / 2;
                overlay.scale.setScalar(1 / 32);
                target.style.pointerEvents = 'none';
                overlay.position.set(cube.position.x, (item.depth ?? 1) + 0.02, cube.position.z);
                scene.add(overlay);
                nextIconTargets.push({ item, target });
            }
            if (!props.readonly && item.id === props.activeEntity?.id) {
                const size = Math.max(0.15, props.config.handleSize ?? 0.3);
                for (const [handle, x, z] of [
                    ['top-left', item.x, item.y],
                    ['top-right', item.x + item.w, item.y],
                    ['bottom-left', item.x, item.y + item.h],
                    ['bottom-right', item.x + item.w, item.y + item.h],
                ]) {
                    const grip = new Mesh(new BoxGeometry(size, size, size),
                        new MeshStandardMaterial({ color: props.config.handleFill ?? '#ffffff', depthTest: false }));
                    grip.position.set(x - width.value / 2, item.depth ?? 1, z - height.value / 2);
                    grip.renderOrder = 1;
                    grip.userData = { handle, item };
                    scene.add(grip);
                }
            }
        }
    });
    iconTargets.value = nextIconTargets;
};

const animate = () => {
    frameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    css3dRenderer.render(scene, camera);
    css2dRenderer.render(scene, camera);
};

function hitTest(event) {
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const rect = canvas.value.getBoundingClientRect();
    mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(scene.children, true).filter(hit => {
        const data = hit.object.userData;
        return data.w || data.handle || data.isFloor || data.isWall;
    });
}

function planeCoordinates() {
    if (!raycaster.ray.intersectPlane(editPlane, editPoint)) return null;
    return { x: editPoint.x + width.value / 2, y: editPoint.z + height.value / 2 };
}

function clearHoverInfo() {
    if (!hoverLabel) return;
    scene.remove(hoverLabel);
    disposeObject(hoverLabel);
    hoverLabel = null;
}

function clearGridHover() {
    if (!hoverCell) return;
    scene.remove(hoverCell);
    disposeObject(hoverCell);
    hoverCell = null;
}

function clearHover() {
    clearHoverInfo();
    clearGridHover();
}

function showGridHover(cell) {
    if (cell.x < 0 || cell.y < 0 || cell.x >= width.value || cell.y >= height.value) {
        clearGridHover();
        return;
    }
    if (hoverCell?.userData.cell.x === cell.x && hoverCell.userData.cell.y === cell.y) return;
    clearGridHover();
    hoverCell = new Group();
    hoverCell.name = 'grid-plan-grid-3d-cell-hover';
    hoverCell.userData.cell = cell;
    hoverCell.position.set(cell.x + 0.5 - width.value / 2, 0.01, cell.y + 0.5 - height.value / 2);

    function addPlane(w, h, color, opacity, x = 0, z = 0, elevation = 0) {
        const plane = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({
            color, transparent: true, opacity, depthWrite: false, side: DoubleSide, toneMapped: false,
        }));
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(x, elevation, z);
        hoverCell.add(plane);
    }
    if (props.config.showCrosshair !== false) {
        addPlane(width.value, 1, props.config.crosshairBackground, 0.35, width.value / 2 - cell.x - 0.5);
        addPlane(1, height.value, props.config.crosshairBackground, 0.35, 0, height.value / 2 - cell.y - 0.5);
    }
    addPlane(1, 1, props.config.gridHighlightColor, 0.2, 0, 0, 0.01);
    const outline = createRectGrid(1, 1, props.config.gridHighlightColor);
    outline.position.y = 0.02;
    hoverCell.add(outline);

    const element = document.createElement('div');
    element.className = 'grid-plan-grid-3d-cell-coordinates';
    element.textContent = `${gridCoordinates.value.abs[cell.x]}-${gridCoordinates.value.ord[cell.y]}`;
    Object.assign(element.style, {
        color: props.config.tooltipColor, fontFamily: props.config.fontFamily,
        whiteSpace: 'nowrap', textShadow: '0 1px 3px #000', paddingBottom: '12px',
    });
    const label = new CSS2DObject(element);
    element.style.pointerEvents = 'none';
    label.center.set(0.5, 1);
    label.position.y = 0.03;
    hoverCell.add(label);
    scene.add(hoverCell);
}

function showHoverInfo(item) {
    if (!item || item.id === props.activeEntity?.id) {
        clearHoverInfo();
        return;
    }
    if (hoverLabel?.userData.item === item) return;
    clearHoverInfo();
    const element = document.createElement('div');
    element.className = 'grid-plan-grid-3d-label grid-plan-grid-3d-hover-info';
    element.textContent = `${item.description ?? ''} (${itemCoordinates(item)})`;
    Object.assign(element.style, {
        whiteSpace: 'nowrap', color: props.config.tooltipColor,
        textShadow: '0 1px 3px #000000', paddingBottom: '20px',
    });
    hoverLabel = new CSS2DObject(element);
    element.style.pointerEvents = 'none';
    hoverLabel.center.set(0.5, 1);
    hoverLabel.position.set(item.x + item.w / 2 - width.value / 2,
        item.depth ?? 1, item.y + item.h / 2 - height.value / 2);
    hoverLabel.userData.item = item;
    scene.add(hoverLabel);
}

function onPointerDown(event) {
    if (event.button !== 0 || gesture) return;
    clearHover();
    container.value.focus({ preventScroll: true });
    const hits = hitTest(event);
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.value.setPointerCapture(event.pointerId);
    const hit = hits.find(hit => hit.object.userData.handle) ?? hits[0];
    const item = hit?.object.userData.item ?? (hit?.object.userData.w ? hit.object.userData : null);
    if (!item || props.readonly) return;
    const handle = hit.object.userData.handle;
    editPlane.constant = -(handle ? (item.depth ?? 1) : hit.point.y);
    const point = planeCoordinates();
    if (!point) return;
    controls.enabled = false;
    drag = { item, initial: { ...item }, handle, wasActive: props.activeEntity?.id === item.id, offset: { x: point.x - item.x, y: point.y - item.y } };
    if (props.activeEntity?.id !== item.id) emit('selectItem', item);
    event.stopImmediatePropagation();
}

function onPointerMove(event) {
    if (gesture && gesture.pointerId !== event.pointerId) return;
    if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4) gesture.moved = true;
    const hits = hitTest(event);
    if (drag) {
        event.stopImmediatePropagation();
        if (!gesture.moved || props.readonly) return;
        const point = planeCoordinates();
        if (!point) return;
        const candidate = editFootprint(drag.initial, drag.handle ? point : {
            x: point.x - drag.offset.x, y: point.y - drag.offset.y,
        }, drag.handle, props.config);
        if (canPlace({ ...drag.item, ...candidate }, props.items, props.config)) {
            Object.assign(drag.item, candidate);
        }
        return;
    }
    const hit = hits[0];
    canvas.value.style.cursor = hit?.object.userData.handle ? 'nwse-resize'
        : hit?.object.userData.w && !props.readonly ? 'move' : 'default';
    const hovered = hit?.object.userData.w ? hit.object.userData : hit?.object.userData.item;
    showHoverInfo(gesture ? null : hovered);
    if (hovered) emit('hoverItem', hovered);
    if (hit?.object.userData.isFloor && !gesture) {
        const cell = { x: Math.floor(hit.point.x + width.value / 2), y: Math.floor(hit.point.z + height.value / 2) };
        showGridHover(cell);
        if (hoverCell) emit('hoverSquare', cell);
    } else clearGridHover();
}

function finishPointer(event, cancelled = false) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const wasDrag = drag;
    const moved = gesture.moved;
    drag = null;
    gesture = null;
    controls.enabled = true;
    if (canvas.value.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId);
    if (wasDrag) {
        if (cancelled) Object.assign(wasDrag.item, wasDrag.initial);
        else if (moved && ['x', 'y', 'w', 'h'].some(key => wasDrag.item[key] !== wasDrag.initial[key])) emit('change', wasDrag.item);
        else if (!moved && wasDrag.wasActive && !wasDrag.handle) emit('unselect');
        return;
    }
    if (cancelled || moved) return;
    const hit = hitTest(event)[0];
    if (hit?.object.userData.w) {
        if (hit.object.userData.id === props.activeEntity?.id) emit('unselect');
        else emit('selectItem', hit.object.userData);
    }
    else if (hit?.object.userData.isFloor && !props.readonly) {
        const cell = { x: Math.floor(hit.point.x + width.value / 2), y: Math.floor(hit.point.z + height.value / 2) };
        if (canPlace({ ...cell, w: 1, h: 1 }, props.items, props.config)) emit('triggerAction', cell);
    } else emit('unselect');
}

function onKeyDown(event) {
    if (event.key === 'Escape') {
        if (gesture) finishPointer({ pointerId: gesture.pointerId }, true);
        emit('unselect');
    }
}

function changeDepth(event) {
    const depth = Number(event.target.value);
    if (props.readonly || !Number.isFinite(depth) || depth <= 0) return;
    props.activeEntity.depth = depth;
    emit('change', props.activeEntity);
}

const onResize = () => {
    if (container.value && renderer && camera) {
        const newWidth = container.value.clientWidth;
        const newHeight = container.value.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.render(scene, camera);
        css2dRenderer.setSize(newWidth, newHeight);
        css3dRenderer.setSize(newWidth, newHeight);
    }
};

onMounted(() => {
    init3DScene();
    window.addEventListener('resize', onResize);
    // Capture item gestures before OrbitControls handles the same pointer.
    canvas.value.addEventListener('pointerdown', onPointerDown, true);
    canvas.value.addEventListener('pointermove', onPointerMove, true);
    canvas.value.addEventListener('pointerup', finishPointer);
    canvas.value.addEventListener('pointercancel', onPointerCancel);
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container.value);
});

function onPointerCancel(event) { finishPointer(event, true); }

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    resizeObserver?.disconnect();
    canvas.value.removeEventListener('pointerdown', onPointerDown, true);
    canvas.value.removeEventListener('pointermove', onPointerMove, true);
    canvas.value.removeEventListener('pointerup', finishPointer);
    canvas.value.removeEventListener('pointercancel', onPointerCancel);
    disposeScene();
    textureCache.forEach(texture => texture.dispose());
});

watch(() => props.readonly, () => {
    if (gesture) finishPointer({ pointerId: gesture.pointerId }, true);
    renderItems();
    addFloor();
    addWalls();
});

watch(
    () => props.items,
    () => {
        renderItems();
        addFloor();
        addWalls();
    },
    { deep: true }
);
watch(
    () => props.activeEntity,
    () => {
        renderItems();
        addFloor();
        addWalls();
    },
    { deep: true }
);

watch(
    () => props.config,
    (newVal) => {
        if (newVal) {
            width.value = props.config.gridWidth;
            height.value = props.config.gridHeight;
            if (gesture) finishPointer({ pointerId: gesture.pointerId }, true);
            disposeScene();
            init3DScene();
        }
    },
    { deep: true }
);
</script>

<template>
    <div 
        ref="container" 
        :style="{
            width: '100%',
            maxWidth: '100%',
            height: '480px',
            minHeight: '240px',
            position: 'relative',
            overflow: 'hidden',
            resize: 'both',
        }" 
        class="grid-plan-grid-3d" 
        tabindex="0"
        aria-label="3D grid editor"
        @keydown="onKeyDown"
    >
        <div v-if="!readonly && activeEntity?.w" class="grid-plan-3d-toolbar"
            style="position: absolute; top: 8px; left: 8px; z-index: 2; display: flex; gap: 8px; background: #ffffff; color: #222; padding: 8px; border-radius: 4px;">
            <label>Depth <input aria-label="Item depth" type="number" min="0.1" step="0.1"
                :value="activeEntity.depth ?? 1" @change="changeDepth" style="width: 64px" /></label>
            <button type="button" @click="emit('delete', activeEntity)">Delete</button>
            <button type="button" @click="emit('unselect')">Unselect</button>
        </div>
        <Teleport v-for="entry in iconTargets" :key="entry.item.id" :to="entry.target">
            <div :style="{
                display: 'grid', placeItems: 'center', width: '32px', height: '32px',
                fontSize: '22.4px', lineHeight: 1,
                color: entry.item.iconColor || config.iconColor, pointerEvents: 'none',
            }" aria-hidden="true">
                <slot name="componentIcon" :placed-item="entry.item" :max-size="32" :icon-color="config.iconColor" />
            </div>
        </Teleport>
        <Teleport v-if="deleteButton" :to="deleteButton">
            <span style="display: grid; place-items: center; width: 16px; height: 16px; pointer-events: none;" aria-hidden="true">
                <slot name="deleteIcon" :item="activeEntity">
                    <svg viewBox="0 0 24 24" width="16" height="16" style="display: block" focusable="false">
                        <path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </slot>
            </span>
        </Teleport>
        <canvas 
            ref="canvas"
            @pointerleave="clearHover" 
            style="touch-action: none"
            :style="{ 
                display: 'block', 
                width: '100%', 
                height: '100%' 
                }"
        >
        </canvas>
    </div>
</template>
