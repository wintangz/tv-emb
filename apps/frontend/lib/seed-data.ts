import type {
  DashboardMetrics,
  DashboardPayload,
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  EmployeeCostBreakdown,
  InventoryItem,
  Customer,
  OrderMaterialAndProfitBreakdown,
  OrderStatus,
  QuoteBreakdown,
  QuoteInput,
} from "./types";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Marcus Vance",
    company: "Apex Logistics & Freight",
    email: "mvance@apexfreight.io",
    phone: "0903 489 210",
    totalOrders: 14,
    totalSpend: 245000000,
    preferredGarments: "Port Authority K500 Polos, Flexfit 110 Caps",
    notes: "Uses PMS 286C Royal Blue -> Madeira #1966 thread match.",
  },
  {
    id: "cust-2",
    name: "Elena Rostova",
    company: "Roast & Ritual Coffee Co.",
    email: "elena@roastritual.com",
    phone: "0908 391 842",
    totalOrders: 9,
    totalSpend: 138500000,
    preferredGarments: "Richardson 112 Trucker Caps, Heavyweight Aprons",
    notes: "Prefers 3D puff foam on cap fronts.",
  },
  {
    id: "cust-3",
    name: "Coach Devon Brooks",
    company: "Westlake Varsity Athletics",
    email: "dbrooks@westlakeathletics.org",
    phone: "0918 774 912",
    totalOrders: 21,
    totalSpend: 412000000,
    preferredGarments:
      "Nike Dri-FIT Polos, Varsity Wool Jackets, Fleece Hoodies",
    notes: "Full jacket back tackle-twill + satin stitch crest every fall.",
  },
  {
    id: "cust-4",
    name: "Hannah Cho",
    company: "Lumina MedSpa & Wellness",
    email: "hannah@luminamedspa.com",
    phone: "0938 602 519",
    totalOrders: 6,
    totalSpend: 86500000,
    preferredGarments: "FIGS Scrub Tops, Softshell Quarter-Zips",
    notes: "Metallic Gold (#1747) accent on left chest lotus emblem.",
  },
  {
    id: "cust-5",
    name: "Trần Minh Quân",
    company: "Saigon Heritage Hospitality Group",
    email: "mtran@saigonheritage.vn",
    phone: "0909 810 429",
    totalOrders: 11,
    totalSpend: 198000000,
    preferredGarments:
      "Chef Coats, Linen Bistro Aprons, Embroidered Polo Uniforms",
    notes:
      "Gold satin stitch logo on black chef coats; individually steamed & bagged.",
  },
];

export const INITIAL_DESIGNS: EmbroideryDesign[] = [
  {
    id: "des-1",
    code: "TV-DST-041",
    name: "Apex Winged Shield Crest",
    clientName: "Apex Logistics & Freight",
    stitchCount: 8450,
    widthMm: 95,
    heightMm: 62,
    hoopSize: "120x120mm Tubular",
    fileFormat: "DST",
    complexity: "Standard",
    digitizerNotes: "Use 2 layers of 2.5oz cutaway backing on pique polo.",
    createdAt: "2026-10-12",
    colorSequence: [
      { needle: 1, threadCode: "M-1966", name: "Navy Blue", hex: "#1e3a8a" },
      { needle: 2, threadCode: "M-1801", name: "Super White", hex: "#f8fafc" },
      { needle: 3, threadCode: "M-1838", name: "Classic Red", hex: "#dc2626" },
      { needle: 4, threadCode: "M-1812", name: "Silver Grey", hex: "#94a3b8" },
    ],
  },
  {
    id: "des-2",
    code: "TV-DST-042",
    name: "Roast & Ritual 3D Puff Wordmark",
    clientName: "Roast & Ritual Coffee Co.",
    stitchCount: 11200,
    widthMm: 115,
    heightMm: 54,
    hoopSize: "270° Cap Frame",
    fileFormat: "EMB",
    complexity: "3D Puff",
    digitizerNotes:
      "3mm black EVA puff foam on Needle 2 satin column; cap tearaway 3oz.",
    createdAt: "2026-10-18",
    colorSequence: [
      {
        needle: 1,
        threadCode: "M-1859",
        name: "Espresso Brown",
        hex: "#78350f",
      },
      {
        needle: 2,
        threadCode: "M-1972",
        name: "Warm Cream (3D Puff)",
        hex: "#fef3c7",
      },
      { needle: 3, threadCode: "M-1768", name: "Burnt Copper", hex: "#d97706" },
    ],
  },
  {
    id: "des-3",
    code: "TV-DST-043",
    name: "Westlake Panthers Full Jacket Back",
    clientName: "Westlake Varsity Athletics",
    stitchCount: 42800,
    widthMm: 265,
    heightMm: 240,
    hoopSize: "300x200mm Mighty Hoop",
    fileFormat: "DST",
    complexity: "Jacket Back",
    digitizerNotes:
      "Tatami fill body with heavy satin border; max speed 750 SPM.",
    createdAt: "2026-10-21",
    colorSequence: [
      {
        needle: 1,
        threadCode: "M-1800",
        name: "Emerald Black",
        hex: "#0f172a",
      },
      { needle: 2, threadCode: "M-1838", name: "Crimson Red", hex: "#b91c1c" },
      {
        needle: 3,
        threadCode: "M-1747",
        name: "Metallic Gold",
        hex: "#eab308",
      },
      { needle: 4, threadCode: "M-1801", name: "Super White", hex: "#ffffff" },
    ],
  },
  {
    id: "des-4",
    code: "TV-DST-044",
    name: "Lumina Lotus Minimalist Monogram",
    clientName: "Lumina MedSpa & Wellness",
    stitchCount: 5600,
    widthMm: 78,
    heightMm: 78,
    hoopSize: "100x100mm Magnetic",
    fileFormat: "PES",
    complexity: "Detailed",
    digitizerNotes: "Use 75/11 sharp needles and water-soluble Solvy topping.",
    createdAt: "2026-10-24",
    colorSequence: [
      {
        needle: 1,
        threadCode: "M-1747",
        name: "Metallic Gold",
        hex: "#ca8a04",
      },
      { needle: 2, threadCode: "M-1940", name: "Sage Green", hex: "#10b981" },
      { needle: 3, threadCode: "M-1801", name: "Super White", hex: "#f8fafc" },
    ],
  },
  {
    id: "des-5",
    code: "TV-DST-045",
    name: "Saigon Heritage Golden Bamboo Seal",
    clientName: "Saigon Heritage Hospitality Group",
    stitchCount: 9800,
    widthMm: 88,
    heightMm: 88,
    hoopSize: "120x120mm Tubular",
    fileFormat: "DST",
    complexity: "Detailed",
    digitizerNotes:
      "Satin bamboo stalks with metallic gold border; run at 700 SPM on Needle 1.",
    createdAt: "2026-10-27",
    colorSequence: [
      {
        needle: 1,
        threadCode: "M-1747",
        name: "Metallic Gold",
        hex: "#eab308",
      },
      {
        needle: 2,
        threadCode: "M-1800",
        name: "Emerald Black",
        hex: "#0f172a",
      },
      { needle: 3, threadCode: "M-1838", name: "Imperial Red", hex: "#dc2626" },
    ],
  },
];

export const INITIAL_MACHINES: EmbroideryMachine[] = [
  {
    id: "mach-1",
    name: "Máy 01 — Tajima TFGN2 (#1)",
    brand: "Tajima",
    model: "TFGN2",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
    currentSpm: 850,
    status: "RUNNING",
    activeOrderId: "ord-101",
    activeOrderNumber: "TV-2610-101",
    progressPercent: 68,
    totalStitchesToday: 842500,
    threadBreaksToday: 2,
    lastMaintenanceDate: "2026-10-15",
  },
  {
    id: "mach-2",
    name: "Máy 02 — Tajima TFGN2 (#2)",
    brand: "Tajima",
    model: "TFGN2",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
    currentSpm: 800,
    status: "RUNNING",
    activeOrderId: "ord-102",
    activeOrderNumber: "TV-2610-102",
    progressPercent: 42,
    totalStitchesToday: 618000,
    threadBreaksToday: 1,
    lastMaintenanceDate: "2026-10-20",
  },
  {
    id: "mach-3",
    name: "Máy 03 — Tajima TFGN2 (#3)",
    brand: "Tajima",
    model: "TFGN2",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
    currentSpm: 820,
    status: "RUNNING",
    activeOrderId: "ord-103",
    activeOrderNumber: "TV-2610-103",
    progressPercent: 35,
    totalStitchesToday: 515000,
    threadBreaksToday: 1,
    lastMaintenanceDate: "2026-10-10",
  },
  {
    id: "mach-4",
    name: "Máy 04 — Tajima TMCP (#1)",
    brand: "Tajima",
    model: "TMCP",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
    currentSpm: 0,
    status: "SETUP",
    activeOrderId: "ord-104",
    activeOrderNumber: "TV-2610-104",
    progressPercent: 0,
    totalStitchesToday: 294000,
    threadBreaksToday: 0,
    lastMaintenanceDate: "2026-10-25",
  },
  {
    id: "mach-5",
    name: "Máy 05 — Tajima TMCP (#2)",
    brand: "Tajima",
    model: "TMCP",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
    currentSpm: 0,
    status: "IDLE",
    activeOrderId: null,
    activeOrderNumber: null,
    progressPercent: 0,
    totalStitchesToday: 185000,
    threadBreaksToday: 0,
    lastMaintenanceDate: "2026-10-28",
  },
];

export const INITIAL_ORDERS: EmbroideryOrder[] = [
  {
    id: "ord-101",
    orderNumber: "TV-2610-101",
    customerId: "cust-1",
    customerName: "Marcus Vance",
    companyName: "Apex Logistics & Freight",
    designId: "des-1",
    designName: "Apex Winged Shield Crest",
    garmentType: "Thân Áo Polo Cắt Bán Thành Phẩm",
    garmentColor: "Navy / Slate",
    placement: "Left Chest",
    quantity: 120,
    completedQuantity: 82,
    sizeBreakdown: { S: 15, M: 35, L: 40, XL: 20, XXL: 10 },
    stitchCount: 8450,
    colorCount: 4,
    threadColors: ["#1e3a8a", "#f8fafc", "#dc2626", "#94a3b8"],
    status: "IN_PRODUCTION",
    paymentStatus: "DEPOSIT_PAID",
    amountPaid: 9900000,
    assignedMachineId: "mach-1",
    dueDate: "2026-11-02",
    createdAt: "2026-10-25",
    rushOrder: false,
    is3DPuff: false,
    splitThreadFor20Heads: true,
    shippingMode: "LOCAL_2_WAY",
    shippingCost: 300000,
    digitizingFee: 0,
    unitPrice: 165000,
    totalPrice: 19800000,
    notes:
      "Khách đã duyệt mẫu thử (0₫). Trường hợp màu chỉ mới đặt riêng cho chuyền 20 đầu: đặt 4 màu × 5 cuộn nguyên (sang ra 20 cuộn/màu). Điều phối xe vận chuyển 2 chiều.",
  },
  {
    id: "ord-102",
    orderNumber: "TV-2610-102",
    customerId: "cust-2",
    customerName: "Elena Rostova",
    companyName: "Roast & Ritual Coffee Co.",
    designId: "des-2",
    designName: "Roast & Ritual 3D Puff Wordmark",
    garmentType: "Mặt Trước Nón Lưỡi Trai (Thêu Nổi 3D EVA)",
    garmentColor: "Charcoal / Black",
    placement: "Cap Front",
    quantity: 72,
    completedQuantity: 30,
    sizeBreakdown: { S: 0, M: 72, L: 0, XL: 0, XXL: 0 },
    stitchCount: 11200,
    colorCount: 3,
    threadColors: ["#78350f", "#fef3c7", "#d97706"],
    status: "IN_PRODUCTION",
    paymentStatus: "PAID",
    amountPaid: 11160000,
    assignedMachineId: "mach-2",
    dueDate: "2026-11-01",
    createdAt: "2026-10-26",
    rushOrder: true,
    is3DPuff: true,
    splitThreadFor20Heads: false,
    shippingMode: "LOCAL_2_WAY",
    shippingCost: 280000,
    digitizingFee: 0,
    unitPrice: 155000,
    totalPrice: 11160000,
    notes:
      "Đơn thêu nổi 3D: Tính thêm định mức Mút EVA (Mouse 3mm) và định mức chỉ trên theo số mũi thêu. Chịu phí vận chuyển 2 chiều.",
  },
  {
    id: "ord-103",
    orderNumber: "TV-2610-103",
    customerId: "cust-3",
    customerName: "Coach Devon Brooks",
    companyName: "Westlake Varsity Athletics",
    designId: "des-3",
    designName: "Westlake Panthers Full Jacket Back",
    garmentType: "Thân Sau Áo Khoác Cắt Rời (Hàng Tỉnh Gửi Chành)",
    garmentColor: "Black / Crimson",
    placement: "Jacket Back",
    quantity: 36,
    completedQuantity: 0,
    sizeBreakdown: { S: 4, M: 10, L: 12, XL: 6, XXL: 4 },
    stitchCount: 42800,
    colorCount: 4,
    threadColors: ["#0f172a", "#b91c1c", "#eab308", "#ffffff"],
    status: "APPROVAL_PENDING",
    paymentStatus: "DEPOSIT_PAID",
    amountPaid: 8640000,
    assignedMachineId: "mach-3",
    dueDate: "2026-11-04",
    createdAt: "2026-10-27",
    rushOrder: false,
    is3DPuff: false,
    shippingMode: "CHANH_XE_PICKUP",
    shippingCost: 150000,
    digitizingFee: 0,
    unitPrice: 480000,
    totalPrice: 17280000,
    notes:
      "Khách tỉnh đã duyệt mẫu thêu. Đợi bán thành phẩm gửi ra chành xe (xưởng chỉ chịu 1 chiều chở từ chành xe về xưởng, không chịu phí gửi đi).",
  },
  {
    id: "ord-104",
    orderNumber: "TV-2610-104",
    customerId: "cust-4",
    customerName: "Hannah Cho",
    companyName: "Lumina MedSpa & Wellness",
    designId: "des-4",
    designName: "Lumina Lotus Minimalist Monogram",
    garmentType: "Thân Áo Scrub Y Tế Cắt Bán Thành Phẩm",
    garmentColor: "Sage / Ivory",
    placement: "Left Chest",
    quantity: 48,
    completedQuantity: 48,
    sizeBreakdown: { S: 16, M: 20, L: 10, XL: 2, XXL: 0 },
    stitchCount: 5600,
    colorCount: 3,
    threadColors: ["#ca8a04", "#10b981", "#f8fafc"],
    status: "QUALITY_CHECK",
    paymentStatus: "PAID",
    amountPaid: 9360000,
    assignedMachineId: null,
    dueDate: "2026-10-31",
    createdAt: "2026-10-23",
    rushOrder: false,
    is3DPuff: false,
    shippingMode: "LOCAL_2_WAY",
    shippingCost: 260000,
    digitizingFee: 0,
    unitPrice: 195000,
    totalPrice: 9360000,
    notes:
      "Tổ Kiểm Hàng (QC) đang cắt chỉ thừa, bóc dựng lót và đếm đủ số lượng trước khi điều phối xe vận chuyển giao hàng.",
  },
  {
    id: "ord-105",
    orderNumber: "TV-2610-105",
    customerId: "cust-5",
    customerName: "Trần Minh Quân",
    companyName: "Saigon Heritage Hospitality Group",
    designId: "des-5",
    designName: "Saigon Heritage Golden Bamboo Seal",
    garmentType: "Áo Bếp & Tạp Dề Nhà Hàng (Đang Làm Mẫu Thử)",
    garmentColor: "Jet Black",
    placement: "Left Chest",
    quantity: 60,
    completedQuantity: 0,
    sizeBreakdown: { S: 10, M: 22, L: 18, XL: 8, XXL: 2 },
    stitchCount: 9800,
    colorCount: 3,
    threadColors: ["#eab308", "#0f172a", "#dc2626"],
    status: "DIGITIZING",
    paymentStatus: "UNPAID",
    amountPaid: 0,
    assignedMachineId: null,
    dueDate: "2026-11-06",
    createdAt: "2026-10-28",
    rushOrder: false,
    is3DPuff: false,
    shippingMode: "CHANH_XE_PICKUP",
    shippingCost: 140000,
    digitizingFee: 0,
    unitPrice: 220000,
    totalPrice: 13200000,
    notes:
      "Đang thiết kế chương trình thêu .DST & phối màu chỉ lên máy thêu mẫu duyệt (chi phí làm mẫu 0₫). Khách duyệt mẫu mới đặt mua chỉ trên.",
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    sku: "CHI-TREN-DEN",
    name: "Chỉ Trên #1800 Đen Tuyền (Đặt Theo Định Mức Đơn)",
    category: "Thread",
    brand: "Polyester 40wt",
    colorCode: "#1800",
    colorHex: "#0f172a",
    material: "Chỉ trên đặt theo định mức đơn hàng (tránh để lâu bị mục)",
    quantity: 10,
    unit: "cones",
    minThreshold: 5,
    unitCost: 45000,
  },
  {
    id: "inv-2",
    sku: "CHI-TREN-TRANG",
    name: "Chỉ Trên #1801 Trắng Sáng (Đặt Theo Định Mức Đơn)",
    category: "Thread",
    brand: "Polyester 40wt",
    colorCode: "#1801",
    colorHex: "#f8fafc",
    material: "Chỉ trên đặt theo định mức số mũi thêu của đơn hàng",
    quantity: 10,
    unit: "cones",
    minThreshold: 5,
    unitCost: 45000,
  },
  {
    id: "inv-3",
    sku: "CHI-TREN-NAVY",
    name: "Chỉ Trên #1966 Xanh Navy (Đặt Theo Đơn TV-2610-101)",
    category: "Thread",
    brand: "Polyester 40wt",
    colorCode: "#1966",
    colorHex: "#1e3a8a",
    material: "Màu chỉ đặt theo đơn (trường hợp cần lên đủ 20 đầu mới sang từ 5 cuộn nguyên)",
    quantity: 5,
    unit: "cones",
    minThreshold: 5,
    unitCost: 45000,
  },
  {
    id: "inv-4",
    sku: "CHI-TREN-DO",
    name: "Chỉ Trên #1838 Đỏ Cờ (Đặt Theo Định Mức Đơn)",
    category: "Thread",
    brand: "Polyester 40wt",
    colorCode: "#1838",
    colorHex: "#dc2626",
    material: "Chỉ trên đặt theo định mức đơn hàng (sang cuộn nhỏ khi cần)",
    quantity: 5,
    unit: "cones",
    minThreshold: 5,
    unitCost: 45000,
  },
  {
    id: "inv-5",
    sku: "CHI-DUOI-TRANG",
    name: "Chỉ Dưới / Chỉ Suốt Trắng (Xài Bao Nhiêu Mua Bấy Nhiêu)",
    category: "Bobbin",
    brand: "Filament 60wt",
    colorCode: "BOB-WHT",
    colorHex: "#f1f5f9",
    material: "Chỉ dưới chạy suốt ổ chao 5 máy Tajima (không tính định mức đơn)",
    quantity: 12,
    unit: "cones",
    minThreshold: 6,
    unitCost: 38000,
  },
  {
    id: "inv-6",
    sku: "KIM-DBXK5-11",
    name: "Kim Máy Thêu Công Nghiệp Organ DB×K5 (Số 11 & 12)",
    category: "Needle",
    brand: "Organ Japan",
    material: "Phụ liệu bắt buộc cho dàn Tajima TFGN2 & TMCP 20 đầu",
    quantity: 8,
    unit: "boxes",
    minThreshold: 4,
    unitCost: 65000,
  },
  {
    id: "inv-7",
    sku: "GIAY-DUNG-LOT",
    name: "Giấy Dựng Lót Thêu (Dựng Xé & Dựng Cắt Khổ Lớn)",
    category: "Backing",
    brand: "Phụ Liệu Xưởng",
    material: "Dựng lót dưới thân áo bán thành phẩm khi lên khung 20 đầu",
    quantity: 4,
    unit: "rolls",
    minThreshold: 2,
    unitCost: 380000,
  },
  {
    id: "inv-8",
    sku: "BANG-KEO-XUONG",
    name: "Băng Keo Dán Hàng & Cố Định Khung Thêu (Cây 6 Cuộn)",
    category: "Backing",
    brand: "Phụ Liệu Xưởng",
    material: "Băng keo phụ liệu cần thiết khi lên hàng & đóng gói",
    quantity: 5,
    unit: "packs",
    minThreshold: 3,
    unitCost: 75000,
  },
  {
    id: "inv-9",
    sku: "MUT-EVA-3D",
    name: "Mút EVA (Mouse 3mm) Chuyên Hàng Thêu Nổi 3D Puff",
    category: "Topping",
    brand: "EVA Foam 3mm",
    colorCode: "EVA-BLK",
    colorHex: "#1e293b",
    material: "Chỉ tính định mức & đặt mua khi đơn hàng có yêu cầu thêu nổi 3D",
    quantity: 3,
    unit: "packs",
    minThreshold: 2,
    unitCost: 220000,
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    code: "TV-NV-01",
    name: "Trần Minh Tuấn",
    role: "Machine Operator",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0918 774 302",
    assignedMachineId: "mach-1",
    payType: "Monthly",
    hourlyRate: 32967,
    monthlyBaseSalary: 9000000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 10.5,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 1680000,
    allowanceAndBonus: 1000000,
    amountPaidMonth: 5000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2021-03-15",
    notes:
      "Thợ đứng máy (Lương CB 9tr • Ca 10.5h từ 7h–18h30, nghỉ trưa 1h • Cơm 35k/ngày • Nhà trọ 500k + Chuyên cần 500k). Luân chuyển đứng máy linh hoạt theo mặt hàng.",
  },
  {
    id: "emp-2",
    code: "TV-NV-02",
    name: "Phạm Quốc Bảo",
    role: "Machine Operator",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0938 551 920",
    assignedMachineId: "mach-2",
    payType: "Monthly",
    hourlyRate: 32967,
    monthlyBaseSalary: 9000000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 10.5,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 1420000,
    allowanceAndBonus: 1000000,
    amountPaidMonth: 5000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2022-07-01",
    notes:
      "Thợ đứng máy (Lương CB 9tr • Thành thạo tự lên hàng & canh khung 20 đầu). Phụ trách chạy đơn nón 3D Puff trên Máy 02.",
  },
  {
    id: "emp-3",
    code: "TV-NV-03",
    name: "Lê Hoàng Nam",
    role: "Machine Operator",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0987 219 654",
    assignedMachineId: "mach-3",
    payType: "Monthly",
    hourlyRate: 32967,
    monthlyBaseSalary: 9000000,
    hoursWorkedMonth: 262.5,
    overtimeHoursMonth: 0,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 1150000,
    allowanceAndBonus: 500000,
    amountPaidMonth: 0,
    paymentStatus: "UNPAID",
    joinedDate: "2023-02-20",
    notes:
      "Thợ đứng máy (Lương CB 9tr • 25 ngày công • Phụ cấp nhà trọ 500k). Vận hành linh hoạt giữa Máy 03 & Máy 04 theo tiến độ chuyền.",
  },
  {
    id: "emp-4",
    code: "TV-NV-04",
    name: "Võ Thị Ngọc Lan",
    role: "Trimming & QC",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0974 603 118",
    assignedMachineId: null,
    payType: "Monthly",
    hourlyRate: 31135,
    monthlyBaseSalary: 8500000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 10.5,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 0,
    allowanceAndBonus: 1000000,
    amountPaidMonth: 5000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2022-06-12",
    notes:
      "Kiểm hàng QC chính (Lương CB 8,5tr • Cơm 35k/ngày • Nhà trọ 500k + Chuyên cần 500k • Tăng ca CN ×200%). Chuyên cắt chỉ, bóc dựng, kiểm lỗi.",
  },
  {
    id: "emp-5",
    code: "TV-NV-05",
    name: "Đặng Thu Hà",
    role: "Trimming & QC",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0909 332 715",
    assignedMachineId: null,
    payType: "Monthly",
    hourlyRate: 29304,
    monthlyBaseSalary: 8000000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 0,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 0,
    allowanceAndBonus: 1000000,
    amountPaidMonth: 9910000,
    paymentStatus: "PAID",
    joinedDate: "2023-09-05",
    notes:
      "Kiểm hàng QC (Lương CB 8tr • Cơm 35k/ngày • Nhà trọ 500k + Chuyên cần 500k). Gọt mút EVA thêu nổi 3D, lặt chỉ thừa và đóng bao.",
  },
  {
    id: "emp-6",
    code: "TV-NV-06",
    name: "Nguyễn Văn Hùng",
    role: "Errands & Delivery",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0903 412 889",
    assignedMachineId: null,
    payType: "Monthly",
    hourlyRate: 27472,
    monthlyBaseSalary: 7500000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 5,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 0,
    allowanceAndBonus: 1000000,
    amountPaidMonth: 4000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2020-11-10",
    notes:
      "Nhân viên giao nhận & hỗ trợ xưởng: Tiếp nhận vật tư phụ liệu (chỉ, kim, băng keo, giấy dựng), hỗ trợ sang chỉ 20 đầu và bốc xếp hàng giao nhận.",
  },
];

export const STANDARD_HOURS_PER_DAY = 10.5;
export const STANDARD_WORK_DAYS_PER_MONTH = 26;
export const MEAL_ALLOWANCE_PER_DAY = 35000;

export function calculateEmployeeCostBreakdown(
  emp: Employee,
): EmployeeCostBreakdown {
  // Standard workshop schedule: 10.5 hours/day (07:00 - 18:30, 1h lunch), 26 standard days/month = 273h
  const daysWorked = Math.max(
    0,
    Math.round((emp.hoursWorkedMonth / STANDARD_HOURS_PER_DAY) * 10) / 10,
  );
  const basePay = Math.round(
    emp.payType === "Monthly"
      ? (emp.monthlyBaseSalary / STANDARD_WORK_DAYS_PER_MONTH) * daysWorked
      : emp.hourlyRate * emp.hoursWorkedMonth,
  );

  // Sunday Overtime is paid at 200% (2.0x) of the regular hourly rate
  const effectiveHourly =
    emp.payType === "Monthly"
      ? emp.monthlyBaseSalary / (STANDARD_WORK_DAYS_PER_MONTH * STANDARD_HOURS_PER_DAY)
      : emp.hourlyRate;
  const overtimePay = Math.round(
    effectiveHourly * 2.0 * emp.overtimeHoursMonth,
  );

  // Meal allowance: 35,000 VND / working day (Tiền cơm 35k/ngày)
  const mealAllowance = Math.round(daysWorked) * MEAL_ALLOWANCE_PER_DAY;

  // Housing (500k) + Attendance (500k) stored in allowanceAndBonus
  const housingAndAttendance = Math.round(emp.allowanceAndBonus || 0);
  const stitchBonus = Math.round(
    (emp.stitchesCompletedMonth / 10000) * (emp.stitchBonusPer10k || 0),
  );
  const allowance = Math.round(mealAllowance + housingAndAttendance);
  const totalCost = Math.round(basePay + overtimePay + stitchBonus + allowance);
  const amountPaid = Math.round(emp.amountPaidMonth || 0);
  const balanceDue = Math.max(0, Math.round(totalCost - amountPaid));

  return {
    daysWorked,
    basePay,
    mealAllowance,
    overtimePay,
    stitchBonus,
    housingAndAttendance,
    allowance,
    totalCost,
    amountPaid,
    balanceDue,
  };
}

/**
 * Calculates per-order material norms (upper thread by stitch consumption,
 * or optional 5-cones/color when a new thread color must be split across all 20 heads),
 * 3D Puff EVA foam, shop consumables (bobbin, needles, tape, backing),
 * and external vehicle shipping cost (2-way local vs 1-way Chành Xe pickup).
 */
export function calculateOrderMaterialAndProfit(
  order: EmbroideryOrder,
): OrderMaterialAndProfitBreakdown {
  const quantity = Math.max(1, order.quantity);
  const colorCount = Math.max(1, order.colorCount);
  const totalUpperThreadMeters = Math.round(
    quantity * (order.stitchCount / 1000) * 5.2,
  );
  const theoreticalConesPerColor = Math.max(
    1,
    Math.ceil(totalUpperThreadMeters / colorCount / 4500),
  );
  const splitThreadFor20Heads =
    order.splitThreadFor20Heads !== undefined
      ? Boolean(order.splitThreadFor20Heads)
      : order.notes.toLowerCase().includes("sang ra 20") ||
        order.notes.toLowerCase().includes("sang 20");
  const masterConesPerColor = splitThreadFor20Heads
    ? Math.max(5, theoreticalConesPerColor)
    : theoreticalConesPerColor;
  const totalMasterConesToBuy = colorCount * masterConesPerColor;
  const totalSubConesFor20Heads = splitThreadFor20Heads
    ? colorCount * 20
    : totalMasterConesToBuy;

  const upperThreadCost = totalMasterConesToBuy * 45000;
  const is3dPuff =
    Boolean(order.is3DPuff) ||
    order.designName.toLowerCase().includes("3d") ||
    order.garmentType.toLowerCase().includes("3d") ||
    order.notes.toLowerCase().includes("3d");
  const evaFoamCost = is3dPuff ? quantity * 4500 : 0;
  const consumablesCost = quantity * 2000; // Chỉ dưới, kim, băng keo, giấy dựng
  const shippingMode =
    order.shippingMode ??
    (order.notes.toLowerCase().includes("chành xe")
      ? "CHANH_XE_PICKUP"
      : "LOCAL_2_WAY");
  const shippingCost =
    order.shippingCost !== undefined
      ? order.shippingCost
      : shippingMode === "CHANH_XE_PICKUP"
        ? 150000
        : 300000;

  const totalOrderDirectCost = Math.round(
    upperThreadCost + evaFoamCost + consumablesCost + shippingCost,
  );
  const orderGrossProfit = Math.round(order.totalPrice - totalOrderDirectCost);

  return {
    colorCount,
    is3dPuff,
    splitThreadFor20Heads,
    totalUpperThreadMeters,
    theoreticalConesPerColor,
    masterConesPerColor,
    totalMasterConesToBuy,
    totalSubConesFor20Heads,
    upperThreadCost,
    evaFoamCost,
    consumablesCost,
    shippingMode,
    shippingCost,
    totalOrderDirectCost,
    orderGrossProfit,
    orderNetBeforeLabor: orderGrossProfit,
  };
}

const ACTIVE_ORDER_STATUS_SET = new Set<OrderStatus>([
  "QUOTE",
  "DIGITIZING",
  "APPROVAL_PENDING",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
]);

export function computeMetricsFromState(
  orders: EmbroideryOrder[],
  machines: EmbroideryMachine[],
  inventory: InventoryItem[],
  employees: Employee[] = INITIAL_EMPLOYEES,
): DashboardMetrics {
  let activeOrdersCount = 0;
  let inProductionCount = 0;
  let pendingApprovalCount = 0;
  let totalQueuedStitches = 0;
  let monthlyRevenue = 0;
  let collectedRevenue = 0;

  for (const order of orders) {
    monthlyRevenue += order.totalPrice;
    collectedRevenue += order.amountPaid ?? 0;

    if (ACTIVE_ORDER_STATUS_SET.has(order.status)) {
      activeOrdersCount += 1;
      const remainingQty = Math.max(
        0,
        order.quantity - order.completedQuantity,
      );
      totalQueuedStitches += remainingQty * order.stitchCount;
    }
    if (order.status === "IN_PRODUCTION") {
      inProductionCount += 1;
    } else if (
      order.status === "APPROVAL_PENDING" ||
      order.status === "DIGITIZING"
    ) {
      pendingApprovalCount += 1;
    }
  }

  const outstandingReceivables = Math.max(
    0,
    Math.round(monthlyRevenue - collectedRevenue),
  );

  let runningMachinesCount = 0;
  for (const m of machines) {
    if (m.status === "RUNNING") runningMachinesCount += 1;
  }

  let lowStockItemsCount = 0;
  let inventoryValue = 0;
  for (const item of inventory) {
    if (item.quantity <= item.minThreshold) lowStockItemsCount += 1;
    inventoryValue += item.quantity * item.unitCost;
  }
  inventoryValue = Math.round(inventoryValue);

  const safeEmployees = employees ?? INITIAL_EMPLOYEES;
  let activeEmployeesCount = 0;
  let monthlyLaborCost = 0;
  let paidLaborCost = 0;
  for (const emp of safeEmployees) {
    if (emp.status === "ACTIVE") activeEmployeesCount += 1;
    monthlyLaborCost += calculateEmployeeCostBreakdown(emp).totalCost;
    paidLaborCost += emp.amountPaidMonth ?? 0;
  }
  monthlyLaborCost = Math.round(monthlyLaborCost);
  paidLaborCost = Math.round(paidLaborCost);
  const unpaidLaborCost = Math.max(
    0,
    Math.round(monthlyLaborCost - paidLaborCost),
  );
  let totalDirectOrderCosts = 0;
  let monthlyMaterialCost = 0;
  let monthlyConsumablesCost = 0;
  let monthlyShippingCost = 0;
  for (const order of orders) {
    const mat = calculateOrderMaterialAndProfit(order);
    totalDirectOrderCosts += mat.totalOrderDirectCost;
    monthlyMaterialCost += mat.upperThreadCost + mat.evaFoamCost;
    monthlyConsumablesCost += mat.consumablesCost;
    monthlyShippingCost += mat.shippingCost;
  }

  monthlyMaterialCost = Math.round(monthlyMaterialCost);
  monthlyConsumablesCost = Math.round(monthlyConsumablesCost);
  monthlyShippingCost = Math.round(monthlyShippingCost);
  const estimatedNetProfit = Math.round(
    monthlyRevenue - monthlyLaborCost - totalDirectOrderCosts,
  );

  return {
    activeOrdersCount,
    inProductionCount,
    pendingApprovalCount,
    totalQueuedStitches,
    monthlyRevenue: Math.round(monthlyRevenue),
    collectedRevenue: Math.round(collectedRevenue),
    outstandingReceivables,
    runningMachinesCount,
    totalMachinesCount: machines.length,
    lowStockItemsCount,
    inventoryValue,
    activeEmployeesCount,
    totalEmployeesCount: safeEmployees.length,
    monthlyLaborCost,
    paidLaborCost,
    unpaidLaborCost,
    monthlyMaterialCost,
    monthlyConsumablesCost,
    monthlyShippingCost,
    estimatedNetProfit,
  };
}

export function getInitialDashboardPayload(): DashboardPayload {
  const orders = structuredClone(INITIAL_ORDERS);
  const designs = structuredClone(INITIAL_DESIGNS);
  const machines = structuredClone(INITIAL_MACHINES);
  const inventory = structuredClone(INITIAL_INVENTORY);
  const customers = structuredClone(INITIAL_CUSTOMERS);
  const employees = structuredClone(INITIAL_EMPLOYEES);
  return {
    orders,
    designs,
    machines,
    inventory,
    customers,
    employees,
    metrics: computeMetricsFromState(orders, machines, inventory, employees),
  };
}

export function calculateEmbroideryQuote(input: QuoteInput): QuoteBreakdown {
  const quantity = Math.max(1, Number(input.quantity || 24));
  const stitchCount = Math.max(1000, Number(input.stitchCount || 8500));
  const colorCount = Math.max(1, Number(input.colorCount || 3));
  const garmentBlankCost = Math.max(
    0,
    Number(input.garmentBlankCost ?? 0),
  );
  const garmentMarkupPercent = Math.max(
    0,
    Number(input.garmentMarkupPercent ?? 0),
  );

  // Commercial embroidery run charge in VND
  let ratePerThousandStitches = 3200;
  let baseHoopsFee = 15000;
  if (quantity >= 144) {
    ratePerThousandStitches = 1800;
    baseHoopsFee = 8000;
  } else if (quantity >= 72) {
    ratePerThousandStitches = 2200;
    baseHoopsFee = 10000;
  } else if (quantity >= 24) {
    ratePerThousandStitches = 2600;
    baseHoopsFee = 12000;
  }

  const thousandUnits = stitchCount / 1000;
  const colorSetupPerPiece = Math.max(0, colorCount - 4) * 2000;
  const runChargePerPiece = Math.round(
    baseHoopsFee +
      thousandUnits * ratePerThousandStitches +
      colorSetupPerPiece,
  );

  // Workshop policy: .DST digitizing & sample sew-out are complimentary (0 VND) before production
  const digitizingFee = 0;

  const garmentPricePerPiece = Math.round(
    garmentBlankCost * (1 + garmentMarkupPercent / 100),
  );

  const puffSurchargePerPiece = input.is3DPuff ? 15000 : 0;

  const unitPriceBeforeRush = Math.round(
    garmentPricePerPiece + runChargePerPiece + puffSurchargePerPiece,
  );

  const subtotal = Math.round(unitPriceBeforeRush * quantity + digitizingFee);

  const rushFee = input.rushOrder ? Math.round(subtotal * 0.2) : 0;
  const totalPrice = Math.round(subtotal + rushFee);
  const finalUnitPrice = Math.round(totalPrice / quantity);

  const effectiveStitchesPerHourPerHead = 850 * 60 * 0.72;
  const activeHeads = Math.min(20, quantity);
  const totalStitches = quantity * stitchCount;
  const estimatedProductionHours = Math.max(
    0.5,
    Math.round(
      (totalStitches / (effectiveStitchesPerHourPerHead * activeHeads)) * 10,
    ) / 10,
  );

  // Upper Thread & Material Norm Calculation (with optional 20-head cone splitting circumstance)
  const totalUpperThreadMeters = Math.round(
    quantity * (stitchCount / 1000) * 5.2,
  );
  const theoreticalConesPerColor = Math.max(
    1,
    Math.ceil(totalUpperThreadMeters / colorCount / 4500),
  );
  const splitThreadFor20Heads = Boolean(input.splitThreadFor20Heads);
  const masterConesPerColor = splitThreadFor20Heads
    ? Math.max(5, theoreticalConesPerColor)
    : theoreticalConesPerColor;
  const totalMasterConesToBuy = colorCount * masterConesPerColor;
  const totalSubConesFor20Heads = splitThreadFor20Heads
    ? colorCount * 20
    : totalMasterConesToBuy;

  const estimatedThreadCost = totalMasterConesToBuy * 45000;
  const estimatedEvaFoamCost = input.is3DPuff ? quantity * 4500 : 0;
  const estimatedConsumablesCost = quantity * 2000;
  const shippingMode = input.shippingMode ?? "LOCAL_2_WAY";
  const shippingCost =
    input.shippingCost !== undefined
      ? Math.max(0, Number(input.shippingCost))
      : shippingMode === "CHANH_XE_PICKUP"
        ? 150000
        : 300000;

  const totalDirectCost =
    garmentBlankCost * quantity +
    estimatedThreadCost +
    estimatedEvaFoamCost +
    estimatedConsumablesCost +
    shippingCost;
  const estimatedOrderNetProfit = Math.round(totalPrice - totalDirectCost);

  return {
    quantity,
    stitchCount,
    digitizingFee,
    runChargePerPiece,
    garmentPricePerPiece,
    puffSurchargePerPiece,
    unitPriceBeforeRush,
    subtotal,
    rushFee,
    totalPrice,
    finalUnitPrice,
    estimatedProductionHours,
    splitThreadFor20Heads,
    theoreticalConesPerColor,
    masterConesPerColor,
    totalMasterConesToBuy,
    totalSubConesFor20Heads,
    estimatedThreadCost,
    estimatedEvaFoamCost,
    estimatedConsumablesCost,
    shippingCost,
    estimatedOrderNetProfit,
  };
}
