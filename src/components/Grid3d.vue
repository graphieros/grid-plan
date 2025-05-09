<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    CSS2DRenderer,
    CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import { convertColorToHex } from "../lib";

const emit = defineEmits([
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
let scene, camera, renderer, css2dRenderer, controls, raycaster, mouse;
let hoveredObject = null;
let gridHelper = null;

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

const activeEntityCoordinates = computed(() => {
    if (!props.activeEntity) return null;
    if (props.activeEntity.h === 1 && props.activeEntity.w === 1) {
        return `${gridCoordinates.value.abs[props.activeEntity.x]}-${gridCoordinates.value.ord[props.activeEntity.y]
            }`;
    }
    return `${gridCoordinates.value.abs[props.activeEntity.x]}-${gridCoordinates.value.ord[props.activeEntity.y]
        }, ${gridCoordinates.value.abs[props.activeEntity.x + props.activeEntity.w - 1]
        }-${gridCoordinates.value.ord[props.activeEntity.y + props.activeEntity.h - 1]
        }`;
});

const init3DScene = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(
        convertColorToHex(props.config.coordinatesBackground).slice(0, -2)
    );

    camera = new THREE.PerspectiveCamera(
        75,
        container.value.clientWidth / container.value.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, height.value, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true });
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const light = new THREE.DirectionalLight(0xffffff, 1);
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

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    gridHelper = new THREE.GridHelper(
        Math.max(height.value, width.value),
        Math.max(height.value, width.value),
        convertColorToHex(props.config.gridStroke).slice(0, -2),
        convertColorToHex(props.config.gridStroke).slice(0, -2)
    );

    scene.add(gridHelper);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

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
    animate();
};

const disposeScene = () => {
    if (renderer) renderer.dispose();
    if (css2dRenderer) container.value.removeChild(css2dRenderer.domElement);
    if (scene) scene.clear();
};

const addFloor = () => {
    const floorGeometry = new THREE.PlaneGeometry(width.value, height.value);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: convertColorToHex(props.config.gridFill).slice(0, -2),
        side: THREE.DoubleSide,
        opacity: 0.5,
        transparent: true,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);
};

const renderItems = () => {
    const SPACING = 0.1;

    while (scene.children.length > 3) {
        const child = scene.children[scene.children.length - 1];
        scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    }

    [...props.items, props.activeEntity].forEach((item) => {
        if (item && item.w && item.h) {
            const geometry = new THREE.BoxGeometry(
                item.w - SPACING,
                1,
                item.h - SPACING
            );
            const material = new THREE.MeshStandardMaterial({
                color: item.color,
                metalness: 0.7,
                roughness: 0.4,
            });

            if (props.activeEntity && item === props.activeEntity) {
                material.emissive = new THREE.Color(
                    convertColorToHex(props.config.gridHighlightColor).slice(0, -2)
                );
                material.emissiveIntensity = 0.5;

                const labelDiv = document.createElement("div");
                labelDiv.className = "grid-plan-grid-3d-label";
                labelDiv.innerHTML = `<div style="display: flex; flex-direction:column; align-items:center"><span>${props.activeEntity.description}</span><span>${activeEntityCoordinates.value}</span></div>`;
                labelDiv.style.marginTop = "-2em";
                labelDiv.style.color = props.config.tooltipColor;
                const label = new CSS2DObject(labelDiv);
                label.position.set(
                    item.x + item.w / 2 - width.value / 2,
                    1,
                    item.y + item.h / 2 - height.value / 2
                );
                scene.add(label);
            }

            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                item.x + item.w / 2 - width.value / 2,
                0.5,
                item.y + item.h / 2 - height.value / 2
            );
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.userData = item;

            scene.add(cube);
        }
    });
};

const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    css2dRenderer.render(scene, camera);
};

const onMouseMove = (event) => {
    const rect = canvas.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (hoveredObject) {
        hoveredObject.material.emissive?.setHex(hoveredObject.currentHex);
        hoveredObject = null;
    }

    if (intersects.length) {
        const intersected = intersects[0].object;
        hoveredObject = intersected;
        intersected.currentHex = intersected.material.emissive?.getHex() || 0;
        intersected.material.emissive?.setHex(0xaaaaaa);

        if (intersected.userData?.w) {
            emit("hoverItem", intersected.userData);
            emit("selectItem", intersected.userData);
        } else {
            const gridPos = intersects[0].point;
            emit("hoverSquare", {
                x: Math.floor(gridPos.x + width.value / 2),
                y: Math.floor(gridPos.z + height.value / 2),
            });
        }
    }
};

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
    }
};

const selectedItem = ref(null);

const onClick = (event) => {
    const rect = canvas.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length) {
        const clickedObject = intersects[0].object;
        const data = clickedObject.userData;
        if (data && data.w) {
            if (selectedItem.value && selectedItem.value.userData.id === data.id) {
                emit("unselect", data);
                selectedItem.value = null;
            } else {
                emit("selectItem", data);
                selectedItem.value = clickedObject;
            }
        } else {
            emit("unselect");
            selectedItem.value = null;
        }
    } else {
        emit("unselect");
        selectedItem.value = null;
    }
};

onMounted(() => {
    init3DScene();
    window.addEventListener("resize", onResize);
    canvas.value.addEventListener("click", onClick);

    const resizeObserver = new ResizeObserver(onResize);
    if (container.value) resizeObserver.observe(container.value);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    canvas.value.removeEventListener("click", onClick);
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
    }
    if (css2dRenderer) container.value.removeChild(css2dRenderer.domElement);
    if (controls) controls.dispose();
    if (scene)
        scene.traverse((object) => {
            if (object.isMesh) {
                object.geometry.dispose();
                if (object.material.isMaterial) object.material.dispose();
                else if (Array.isArray(object.material))
                    object.material.forEach((mat) => mat.dispose());
            }
        });
});

watch(
    () => props.items,
    () => {
        renderItems();
        addFloor();
    },
    { deep: true }
);
watch(
    () => props.activeEntity,
    () => {
        renderItems();
        addFloor();
    },
    { deep: true }
);

watch(
    () => props.config,
    (newVal) => {
        if (newVal) {
            width.value = props.config.gridWidth;
            height.value = props.config.gridHeight;
            disposeScene();
            init3DScene();
            renderItems();
            addFloor();
        }
    },
    { deep: true }
);
</script>

<template>
    <div ref="container" :style="{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        resize: 'both',
    }" class="grid-plan-grid-3d" @mouseleave="emit('unselect')">
        <canvas ref="canvas" @mousemove="onMouseMove"
            :style="{ display: 'block', width: '100%', height: '100%' }"></canvas>
    </div>
</template>
