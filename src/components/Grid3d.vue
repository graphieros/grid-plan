<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { convertColorToHex } from '../lib';

const emit = defineEmits(['hoverSquare', 'hoverItem', 'selectItem', 'unselect']);

const props = defineProps({
    items: {
        type: Array,
        default: () => []
    },
    activeEntity: {
        type: Object,
        default: () => ({})
    },
    config: {
        type: Object,
        default: () => ({})
    },
    readonly: {
        type: Boolean,
        default: false
    }
});

const width = ref(props.config.gridWidth);
const height = ref(props.config.gridHeight);

const container = ref(null);
const canvas = ref(null);
let scene, camera, renderer, controls, raycaster, mouse;
let hoveredObject = null;
let gridHelper = null;

const init3DScene = () => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(convertColorToHex(props.config.coordinatesBackground).slice(0, -2));

    camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000);
    camera.position.set(10, 15, 20);
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
        convertColorToHex(props.config.gridStroke).slice(0, -2),
    );

    scene.add(gridHelper);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderItems();
    addFloor();
    animate();
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

    [...props.items, props.activeEntity].forEach(item => {
        if (item && item.w && item.h) {
            const geometry = new THREE.BoxGeometry(item.w - SPACING, 1, item.h - SPACING);
            const material = new THREE.MeshStandardMaterial({
                color: item.color, 
                metalness: 0.7, 
                roughness: 0.4,
            });

            if (props.activeEntity && item === props.activeEntity) {
                material.emissive = new THREE.Color(convertColorToHex(props.config.gridHighlightColor).slice(0, -2));
                material.emissiveIntensity = 0.5;
            }

            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (item.x + item.w / 2 - (width.value / 2)),
                0.5,
                (item.y + item.h / 2 - height.value / 2)
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
            emit('hoverItem', intersected.userData);
        } else {
            const gridPos = intersects[0].point;
            emit('hoverSquare', { x: Math.floor(gridPos.x + width.value / 2), y: Math.floor(gridPos.z + height.value / 2) });
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
        
        if (clickedObject.userData) {

            if (selectedItem.value && selectedItem.value.userData.id === clickedObject.userData.id) {
                emit('unselect', clickedObject.userData); 
                selectedItem.value = null; 
            } else {
                emit('selectItem', clickedObject.userData);
                selectedItem.value = clickedObject;
            }
        }
    }
};

onMounted(() => {
    init3DScene();
    window.addEventListener('resize', onResize);
    canvas.value.addEventListener('click', onClick); 

    const resizeObserver = new ResizeObserver(onResize);
    if (container.value) {
        resizeObserver.observe(container.value)
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    canvas.value.removeEventListener('click', onClick);
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
    }
    if (controls) controls.dispose();
    if (scene) {
        scene.traverse(object => {
            if (object.isMesh) {
                object.geometry.dispose();
                if (object.material.isMaterial) {
                    object.material.dispose();
                } else if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                }
            }
        });
    }
});

watch(() => props.items, () => {
    renderItems();
    addFloor();
}, { deep: true });
watch(() => props.activeEntity, () => {
    renderItems();
    addFloor();
}, { deep: true });

</script>

<template>
    <div 
        ref="container"
        :style="{
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            resize: 'both'
        }"
        class="grid-plan-grid-3d"
    >
        <canvas 
            ref="canvas" 
            @mousemove="onMouseMove"
            :style="{
                display: 'block',
                width: '100%',
                height: '100%'
            }"
        >
        </canvas>
    </div>
</template>
