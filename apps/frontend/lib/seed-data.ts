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
    name: "Line 1 — Barudan 6-Head Pro",
    brand: "Barudan",
    model: "BEKT-S1506CII",
    heads: 6,
    needlesPerHead: 15,
    maxSpm: 1100,
    currentSpm: 950,
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
    name: "Line 2 — Tajima Auto-Tension",
    brand: "Tajima",
    model: "TMEZ-SC1501",
    heads: 1,
    needlesPerHead: 15,
    maxSpm: 1200,
    currentSpm: 800,
    status: "RUNNING",
    activeOrderId: "ord-102",
    activeOrderNumber: "TV-2610-102",
    progressPercent: 42,
    totalStitchesToday: 318000,
    threadBreaksToday: 1,
    lastMaintenanceDate: "2026-10-20",
  },
  {
    id: "mach-3",
    name: "Line 3 — Ricoma Dual-Head",
    brand: "Ricoma",
    model: "MT-1502-8S",
    heads: 2,
    needlesPerHead: 15,
    maxSpm: 1000,
    currentSpm: 0,
    status: "SETUP",
    activeOrderId: "ord-103",
    activeOrderNumber: "TV-2610-103",
    progressPercent: 0,
    totalStitchesToday: 215000,
    threadBreaksToday: 0,
    lastMaintenanceDate: "2026-10-10",
  },
  {
    id: "mach-4",
    name: "Sample Station — Brother 10-Needle",
    brand: "Brother",
    model: "PR1055X Entrepreneur",
    heads: 1,
    needlesPerHead: 10,
    maxSpm: 1000,
    currentSpm: 0,
    status: "IDLE",
    activeOrderId: null,
    activeOrderNumber: null,
    progressPercent: 0,
    totalStitchesToday: 94000,
    threadBreaksToday: 0,
    lastMaintenanceDate: "2026-10-25",
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
    garmentType: "Port Authority K500 Silk Touch Polo",
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
    digitizingFee: 0,
    unitPrice: 165000,
    totalPrice: 19800000,
    notes: "Fold & polybag individually with size stickers.",
  },
  {
    id: "ord-102",
    orderNumber: "TV-2610-102",
    customerId: "cust-2",
    customerName: "Elena Rostova",
    companyName: "Roast & Ritual Coffee Co.",
    designId: "des-2",
    designName: "Roast & Ritual 3D Puff Wordmark",
    garmentType: "Richardson 112 Snapback Trucker Cap",
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
    amountPaid: 11510000,
    assignedMachineId: "mach-2",
    dueDate: "2026-11-01",
    createdAt: "2026-10-26",
    rushOrder: true,
    digitizingFee: 350000,
    unitPrice: 155000,
    totalPrice: 11510000,
    notes:
      "RUSH for weekend coffee festival. Heat-gun clean 3D puff foam edges.",
  },
  {
    id: "ord-103",
    orderNumber: "TV-2610-103",
    customerId: "cust-3",
    customerName: "Coach Devon Brooks",
    companyName: "Westlake Varsity Athletics",
    designId: "des-3",
    designName: "Westlake Panthers Full Jacket Back",
    garmentType: "Holloway Varsity Wool/Leather Jacket",
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
    amountPaid: 8940000,
    assignedMachineId: "mach-3",
    dueDate: "2026-11-04",
    createdAt: "2026-10-27",
    rushOrder: false,
    digitizingFee: 600000,
    unitPrice: 480000,
    totalPrice: 17880000,
    notes: "Sew-out sample photo sent to Coach Brooks for final sign-off.",
  },
  {
    id: "ord-104",
    orderNumber: "TV-2610-104",
    customerId: "cust-4",
    customerName: "Hannah Cho",
    companyName: "Lumina MedSpa & Wellness",
    designId: "des-4",
    designName: "Lumina Lotus Minimalist Monogram",
    garmentType: "FIGS Casma Three-Pocket Scrub Top",
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
    amountPaid: 9660000,
    assignedMachineId: null,
    dueDate: "2026-10-31",
    createdAt: "2026-10-23",
    rushOrder: false,
    digitizingFee: 300000,
    unitPrice: 195000,
    totalPrice: 9660000,
    notes: "Trim jump stitches and steam out hoop marks.",
  },
  {
    id: "ord-105",
    orderNumber: "TV-2610-105",
    customerId: "cust-5",
    customerName: "Trần Minh Quân",
    companyName: "Saigon Heritage Hospitality Group",
    designId: "des-5",
    designName: "Saigon Heritage Golden Bamboo Seal",
    garmentType: "Mercer Culinary Millennia Chef Coat",
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
    digitizingFee: 350000,
    unitPrice: 220000,
    totalPrice: 13550000,
    notes:
      "Metallic gold thread on black chef twill; use 80/12 titanium needles.",
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    sku: "MAD-1800",
    name: "Madeira Polyneon #1800 Emerald Black (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1800",
    colorHex: "#0f172a",
    material: "40wt Polyester",
    quantity: 18,
    unit: "cones",
    minThreshold: 8,
    unitCost: 95000,
  },
  {
    id: "inv-2",
    sku: "MAD-1801",
    name: "Madeira Polyneon #1801 Super White (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1801",
    colorHex: "#f8fafc",
    material: "40wt Polyester",
    quantity: 14,
    unit: "cones",
    minThreshold: 8,
    unitCost: 95000,
  },
  {
    id: "inv-3",
    sku: "MAD-1966",
    name: "Madeira Polyneon #1966 Navy Blue (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1966",
    colorHex: "#1e3a8a",
    material: "40wt Polyester",
    quantity: 4,
    unit: "cones",
    minThreshold: 6,
    unitCost: 95000,
  },
  {
    id: "inv-4",
    sku: "MAD-1838",
    name: "Madeira Polyneon #1838 Classic Red (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1838",
    colorHex: "#dc2626",
    material: "40wt Polyester",
    quantity: 9,
    unit: "cones",
    minThreshold: 5,
    unitCost: 95000,
  },
  {
    id: "inv-5",
    sku: "MAD-1747",
    name: "Madeira FS #1747 Metallic Gold (2500m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1747",
    colorHex: "#eab308",
    material: "40wt Metallic",
    quantity: 2,
    unit: "cones",
    minThreshold: 4,
    unitCost: 185000,
  },
  {
    id: "inv-6",
    sku: "MAD-1972",
    name: "Madeira Polyneon #1972 Warm Cream (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1972",
    colorHex: "#fef3c7",
    material: "40wt Polyester",
    quantity: 7,
    unit: "cones",
    minThreshold: 4,
    unitCost: 95000,
  },
  {
    id: "inv-7",
    sku: "BAK-CUT-25",
    name: 'Heavy Cutaway Backing 2.5oz (20" x 100yd)',
    category: "Backing",
    brand: "Gunold",
    material: "Non-Woven Cutaway",
    quantity: 5,
    unit: "rolls",
    minThreshold: 3,
    unitCost: 850000,
  },
  {
    id: "inv-8",
    sku: "BAK-CAP-30",
    name: 'Cap Tearaway Backing 3.0oz Strips (4.25" x 100yd)',
    category: "Backing",
    brand: "Gunold",
    material: "Crisp Tearaway",
    quantity: 2,
    unit: "rolls",
    minThreshold: 3,
    unitCost: 480000,
  },
  {
    id: "inv-9",
    sku: "BOB-L-WHT",
    name: "Magna-Glide Magnetic Core Bobbins Style L (Gross 144ct)",
    category: "Bobbin",
    brand: "Fil-Tec",
    material: "60wt Filament Poly",
    quantity: 6,
    unit: "boxes",
    minThreshold: 3,
    unitCost: 620000,
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    code: "TV-NV-01",
    name: "Nguyễn Văn Hùng",
    role: "Shop Supervisor",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0903 412 889",
    assignedMachineId: "mach-1",
    payType: "Monthly",
    hourlyRate: 75000,
    monthlyBaseSalary: 13200000,
    hoursWorkedMonth: 176,
    overtimeHoursMonth: 14,
    stitchBonusPer10k: 2500,
    stitchesCompletedMonth: 1480000,
    allowanceAndBonus: 1200000,
    amountPaidMonth: 8000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2021-03-15",
    notes:
      "Quản đốc xưởng & phụ trách dàn Barudan 6 đầu (cân chỉnh ổ chao, độ căng chỉ).",
  },
  {
    id: "emp-2",
    code: "TV-NV-02",
    name: "Trần Minh Tuấn",
    role: "Machine Operator",
    shift: "Morning",
    status: "ACTIVE",
    phone: "0918 774 302",
    assignedMachineId: "mach-2",
    payType: "Hourly",
    hourlyRate: 48000,
    monthlyBaseSalary: 8500000,
    hoursWorkedMonth: 168,
    overtimeHoursMonth: 18,
    stitchBonusPer10k: 3000,
    stitchesCompletedMonth: 960000,
    allowanceAndBonus: 800000,
    amountPaidMonth: 5000000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2022-07-01",
    notes:
      "Chuyên chạy nón 3D Puff trên máy Tajima TMEZ và canh khung từ Mighty Hoop.",
  },
  {
    id: "emp-3",
    code: "TV-NV-03",
    name: "Lê Hoàng Nam",
    role: "Digitizer",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0987 219 654",
    assignedMachineId: "mach-4",
    payType: "Monthly",
    hourlyRate: 68000,
    monthlyBaseSalary: 11968000,
    hoursWorkedMonth: 168,
    overtimeHoursMonth: 8,
    stitchBonusPer10k: 2000,
    stitchesCompletedMonth: 620000,
    allowanceAndBonus: 900000,
    amountPaidMonth: 13808000,
    paymentStatus: "PAID",
    joinedDate: "2021-11-10",
    notes:
      "Kỹ thuật thiết kế mẫu Wilcom E4.5 (.EMB / .DST) và thêu mẫu duyệt trên máy Brother.",
  },
  {
    id: "emp-4",
    code: "TV-NV-04",
    name: "Phạm Quốc Bảo",
    role: "Machine Operator",
    shift: "Afternoon",
    status: "ACTIVE",
    phone: "0938 551 920",
    assignedMachineId: "mach-3",
    payType: "Hourly",
    hourlyRate: 45000,
    monthlyBaseSalary: 8000000,
    hoursWorkedMonth: 160,
    overtimeHoursMonth: 12,
    stitchBonusPer10k: 2800,
    stitchesCompletedMonth: 780000,
    allowanceAndBonus: 700000,
    amountPaidMonth: 0,
    paymentStatus: "UNPAID",
    joinedDate: "2023-02-20",
    notes:
      "Vận hành máy thêu Ricoma 2 đầu; chuyên hàng áo khoác lưng lớn và con giống.",
  },
  {
    id: "emp-5",
    code: "TV-NV-05",
    name: "Võ Thị Ngọc Lan",
    role: "Trimming & QC",
    shift: "Morning",
    status: "ACTIVE",
    phone: "0974 603 118",
    assignedMachineId: null,
    payType: "Hourly",
    hourlyRate: 36000,
    monthlyBaseSalary: 6500000,
    hoursWorkedMonth: 164,
    overtimeHoursMonth: 10,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 0,
    allowanceAndBonus: 600000,
    amountPaidMonth: 3500000,
    paymentStatus: "PARTIAL_ADVANCE",
    joinedDate: "2023-06-12",
    notes:
      "Tổ trưởng khâu cắt chỉ thừa, bóc keo lót, ủi hơi xóa vết khung và đóng gói.",
  },
  {
    id: "emp-6",
    code: "TV-NV-06",
    name: "Đặng Thu Hà",
    role: "Sales & Coordinator",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "0909 332 715",
    assignedMachineId: null,
    payType: "Monthly",
    hourlyRate: 55000,
    monthlyBaseSalary: 9680000,
    hoursWorkedMonth: 168,
    overtimeHoursMonth: 4,
    stitchBonusPer10k: 0,
    stitchesCompletedMonth: 0,
    allowanceAndBonus: 1100000,
    amountPaidMonth: 11110000,
    paymentStatus: "PAID",
    joinedDate: "2022-09-05",
    notes: "Điều phối đơn hàng, nhận phôi áo khách gửi và theo dõi công nợ.",
  },
];

export function calculateEmployeeCostBreakdown(
  emp: Employee,
): EmployeeCostBreakdown {
  const basePay = Math.round(
    emp.payType === "Monthly"
      ? emp.monthlyBaseSalary
      : emp.hourlyRate * emp.hoursWorkedMonth,
  );
  const effectiveHourly =
    emp.payType === "Monthly" ? emp.monthlyBaseSalary / 176 : emp.hourlyRate;
  const overtimePay = Math.round(
    effectiveHourly * 1.5 * emp.overtimeHoursMonth,
  );
  const stitchBonus = Math.round(
    (emp.stitchesCompletedMonth / 10000) * emp.stitchBonusPer10k,
  );
  const allowance = Math.round(emp.allowanceAndBonus || 0);
  const totalCost = Math.round(basePay + overtimePay + stitchBonus + allowance);
  const amountPaid = Math.round(emp.amountPaidMonth || 0);
  const balanceDue = Math.max(0, Math.round(totalCost - amountPaid));
  return {
    basePay,
    overtimePay,
    stitchBonus,
    allowance,
    totalCost,
    amountPaid,
    balanceDue,
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
  const estimatedNetProfit = Math.round(monthlyRevenue - monthlyLaborCost);

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
  const garmentBlankCost = Math.max(0, Number(input.garmentBlankCost || 95000));
  const garmentMarkupPercent = Math.max(
    0,
    Number(input.garmentMarkupPercent || 45),
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

  const rawDigitizing = Math.max(250000, Math.round(thousandUnits * 35000));
  const digitizingFee = input.needsDigitizing
    ? quantity >= 144 && stitchCount <= 15000
      ? 0
      : rawDigitizing
    : 0;

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
  const activeHeads = Math.min(6, quantity);
  const totalStitches = quantity * stitchCount;
  const estimatedProductionHours = Math.max(
    0.5,
    Math.round(
      (totalStitches / (effectiveStitchesPerHourPerHead * activeHeads)) * 10,
    ) / 10,
  );

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
  };
}
