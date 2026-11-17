export const baseTypes = [
  {
    typeId: 1,
    description: "Door",
    color: "#bbcccc",
    icon: "door",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 2,
    description: "Wall",
    color: "#8a8a8a",
    icon: "wall",
    iconColor: "#ffffff",
  },
  {
    typeId: 3,
    description: "Server",
    color: "#6385ed",
    icon: "server",
    iconColor: "#ffffff",
  },
  {
    typeId: 4,
    description: "Power",
    color: "#e79558",
    icon: "bolt",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 5,
    description: "Monitor",
    color: "#71a4a8",
    icon: "deviceLaptop",
    iconColor: "#ffffff",
  },
  {
    typeId: 6,
    description: "Router",
    color: "#bd9de6",
    icon: "router",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 7,
    description: "Database",
    color: "#7aebab",
    icon: "database",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 8,
    description: "Phone",
    color: "#f595c0",
    icon: "phone",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 9,
    description: "AC",
    color: "#95d5f5",
    icon: "airConditioning",
    iconColor: "#1a1a1a",
  },
  {
    typeId: 10,
    description: "Custom sensor",
    color: "#dfbd77",
    iconColor: "#1a1a1a",
    icon: {
      viewBox: "0 0 32 32",
      paths: [
        "M6 8H26V24H6Z",
        "M10 3V8M16 3V8M22 3V8M10 24V29M16 24V29M22 24V29",
        "M10 16H13L15 12L18 20L20 16H23",
      ],
      strokeWidth: 1.8,
    },
  },
];

export const libraryIcons = {
  1: 'bi-door-open', 2: 'bi-bricks', 3: 'bi-hdd-rack', 4: 'bi-lightning-charge',
  5: 'bi-display', 6: 'bi-router', 7: 'bi-database', 8: 'bi-telephone',
  9: 'bi-snow', 10: 'bi-cpu',
};

export function createSampleItems(config) {
  const w = config.gridWidth;
  const h = config.gridHeight;
  return [
    { id: "sample-server", typeId: 3, depth: 1.8, x: 0, y: 0, w: 1, h: 2 },
    { id: "sample-sensor", typeId: 10, depth: 0.6, x: 1, y: 0, w: 1, h: 2 },
    { id: "sample-power", typeId: 4, depth: 0.8, x: w - 2, y: 0, w: 2, h: 2 },
    {
      id: "sample-database",
      typeId: 7,
      depth: 1.2,
      x: 0,
      y: h - 2,
      w: 2,
      h: 2,
    },
    {
      id: "sample-monitor",
      typeId: 5,
      depth: 0.5,
      x: w - 2,
      y: h - 2,
      w: 2,
      h: 2,
    },
  ];
}
