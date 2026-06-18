export const ITEM_CATEGORIES = {
    MAT_BASIC: { label: "Recursos Básicos", color: "#a0a0a0" },
    MAT_MEDIUM: { label: "Recursos Médios", color: "#00ffaa" },
    MAT_ADVANCED: { label: "Recursos Avançados", color: "#c478ff" },
    MAT_UNIQUE: { label: "Artefatos & Materiais Únicos", color: "#ff3366" }, // Roxo/Rosa antigo/Exótico
    EQUIP_WPN: { label: "Sistemas de Armamento", color: "#ff453a" },
    EQUIP_SHIELD: { label: "Sistemas de Defesa", color: "#00eaff" }, // Ciano para escudos
    EQUIP_POW: { label: "Gerenciamento de Energia", color: "#ffd54a" },
    EQUIP_NAV: { label: "Sistemas de Navegação", color: "#50e3c2" },
    EQUIP_THR: { label: "Propulsão / Motores", color: "#ff9d00" },
    PICKUP: { label: "Coletáveis Imediatos", color: "#ffffff" }
};

export const ITEMS_DATABASE = {
    // ==========================================
    // 1. MATERIAIS DE CONSTRUÇÃO & CRAFTING
    // ==========================================

    // --- Básicos ---
    "carbon_fragment": {
        id: "carbon_fragment",
        name: "Fragmento de Carbono",
        category: "MAT_BASIC",
        icon: "⬛",
        description: "Resíduo mineral abundante utilizado na fabricação de componentes simples."
    },

    "silicon_crystal": {
        id: "silicon_crystal",
        name: "Cristal de Silício",
        category: "MAT_BASIC",
        icon: "🔷",
        description: "Material essencial para circuitos eletrônicos básicos."
    },

    "iron_ore": {
        id: "iron_ore",
        name: "Minério de Ferro",
        category: "MAT_BASIC",
        icon: "⛏️",
        description: "Minério bruto utilizado em processos de refinamento industrial."
    },

    "aluminum_scrap": {
        id: "aluminum_scrap",
        name: "Sucata de Alumínio",
        category: "MAT_BASIC",
        icon: "⚪",
        description: "Metal leve reaproveitado de estruturas espaciais abandonadas."
    },

    "polymer_resin": {
        id: "polymer_resin",
        name: "Resina Polimérica",
        category: "MAT_BASIC",
        icon: "🧪",
        description: "Substância sintética usada em revestimentos e componentes leves."
    },

    "coolant_gel": {
        id: "coolant_gel",
        name: "Gel Refrigerante",
        category: "MAT_BASIC",
        icon: "🧊",
        description: "Composto utilizado para dissipação térmica de sistemas eletrônicos."
    },

    "micro_circuit": {
        id: "micro_circuit",
        name: "Microcircuito",
        category: "MAT_BASIC",
        icon: "📟",
        description: "Pequena placa eletrônica encontrada em destroços tecnológicos."
    },

    "energy_dust": {
        id: "energy_dust",
        name: "Poeira Energética",
        category: "MAT_BASIC",
        icon: "✨",
        description: "Partículas carregadas coletadas em regiões de atividade estelar."
    },

    "crystal_shard": {
        id: "crystal_shard",
        name: "Lasca Cristalina",
        category: "MAT_BASIC",
        icon: "💠",
        description: "Pequeno fragmento cristalino com aplicações industriais."
    },

    "industrial_bolts": {
        id: "industrial_bolts",
        name: "Parafusos Industriais",
        category: "MAT_BASIC",
        icon: "🔩",
        description: "Fixadores universais utilizados em praticamente toda nave espacial."
    },

    // --- Médios ---
    "nano_alloy": {
        id: "nano_alloy",
        name: "Nano Liga Metálica",
        category: "MAT_MEDIUM",
        icon: "⚙️",
        description: "Liga reforçada produzida através de manipulação molecular."
    },

    "superconductor": {
        id: "superconductor",
        name: "Supercondutor",
        category: "MAT_MEDIUM",
        icon: "⚡",
        description: "Material avançado capaz de transmitir energia sem perdas."
    },

    "fusion_cell": {
        id: "fusion_cell",
        name: "Célula de Fusão",
        category: "MAT_MEDIUM",
        icon: "🔋",
        description: "Fonte energética compacta utilizada em equipamentos de médio porte."
    },

    "encrypted_chip": {
        id: "encrypted_chip",
        name: "Chip Criptografado",
        category: "MAT_MEDIUM",
        icon: "💽",
        description: "Dispositivo contendo dados protegidos de antigas corporações espaciais."
    },

    "plasma_crystal": {
        id: "plasma_crystal",
        name: "Cristal de Plasma",
        category: "MAT_MEDIUM",
        icon: "🔶",
        description: "Cristal energizado utilizado em armas e reatores intermediários."
    },

    // --- Avançados ---
    "antimatter_core": {
        id: "antimatter_core",
        name: "Núcleo de Antimatéria",
        category: "MAT_ADVANCED",
        icon: "🔮",
        description: "Altamente instável. Componente crítico para hiper-propulsores e armas pesadas."
    },
    "quantum_processor": {
        id: "quantum_processor",
        name: "Processador Quântico",
        category: "MAT_ADVANCED",
        icon: "💾",
        description: "Computador molecular capaz de recalcular rotas de salto em milissegundos."
    },

    // --- MATERIAIS ÚNICOS (Loot Lendário de Chefes / Eventos) ---
    "void_matter": {
        id: "void_matter",
        name: "Matéria do Vazio (Singularidade)",
        category: "MAT_UNIQUE",
        icon: "🖤",
        description: "Um pedaço de tecido espacial colhido na borda de um buraco negro. Distorce as leis da física ao seu redor."
    },
    "stellar_nucleus": {
        id: "stellar_nucleus",
        name: "Fragmento de Estrela de Nêutrons",
        category: "MAT_UNIQUE",
        icon: "☀️",
        description: "Uma lasca hiper-densa de uma estrela colapsada. Pesa gigatoneladas, mas gera energia térmica virtualmente infinita."
    },

    // ==========================================
    // 2. ITENS EQUIPÁVEIS (HARDWARE)
    // ==========================================

    // --- Armas (WPN) ---
    "laser_vx": {
        id: "laser_vx",
        name: "Canhão Laser VX",
        category: "EQUIP_WPN",
        icon: "🔫",
        slotType: "WPN",
        description: "Disparador de fótons contínuo. Perfeito para derreter escudos inimigos."
    },
    "plasma_torpedo": {
        id: "plasma_torpedo",
        name: "Lançador de Plasma",
        category: "EQUIP_WPN",
        icon: "💣",
        slotType: "WPN",
        description: "Dispara esferas de plasma superaquecido. Alto dano de impacto em cascos."
    },
    "railgun_beam": {
        id: "railgun_beam",
        name: "Raio Laser de Fusão Pesada (Railgun)",
        category: "EQUIP_WPN",
        icon: "⚡",
        slotType: "WPN",
        description: "Arma tática de precisão. Dispara um raio perfurante concentrado que atravessa múltiplas estruturas."
    },

    // --- Defesa / Escudos (SHIELD) ---
    "shield_aegis": {
        id: "shield_aegis",
        name: "Escudo Ativável Aegis V1",
        category: "EQUIP_SHIELD",
        icon: "🛡️",
        slotType: "NAV", // Pode ser mapeado para os slots auxiliares do core (NAV/POW)
        description: "Barreira de energia ativável manual. Absorve 100% dos projéteis por 5 segundos antes de entrar em cooldown."
    },
    "bubble_reflector": {
        id: "bubble_reflector",
        name: "Defletor de Matriz Cinética",
        category: "EQUIP_SHIELD",
        icon: "🌀",
        slotType: "NAV",
        description: "Escudo passivo que tem 15% de chance de refletir lasers inimigos de volta para a origem."
    },

    // --- Energia / Reatores (POW) ---
    "cell_alpha": {
        id: "cell_alpha",
        name: "Célula de Energia Alfa",
        category: "EQUIP_POW",
        icon: "🔋",
        slotType: "POW",
        description: "Bateria padrão de fusão fria para manter os sistemas da nave estabilizados."
    },
    "overcharged_core": {
        id: "overcharged_core",
        name: "Reator Hiper-Carregado",
        category: "EQUIP_POW",
        icon: "💥",
        slotType: "POW",
        description: "Aumenta o dano de todas as armas instaladas em 20%, mas drena o escudo passivo lentamente."
    },

    // --- Navegação & Salto (NAV / WRP) ---
    "warp_drive_v1": {
        id: "warp_drive_v1",
        name: "Módulo de Salto Dobra",
        category: "EQUIP_NAV",
        icon: "🌌",
        slotType: "WRP",
        description: "Permite que a nave realize saltos hiperespaciais entre setores galácticos."
    },

    // --- Propulsão / Motores (THR) ---
    "ion_thruster": {
        id: "ion_thruster",
        name: "Propulsor de Íons Básico",
        category: "EQUIP_THR",
        icon: "🚀",
        slotType: "THR",
        description: "Empuxo constante para navegação fluida em velocidade de cruzeiro cósmica."
    },

    // ==========================================
    // 3. PICKUPS & CONSUMÍVEIS IMEDIATOS
    // ==========================================
    "nanite_repair": {
        id: "nanite_repair",
        name: "Kit de Nanites de Reparo",
        category: "PICKUP",
        icon: "🛠️",
        description: "Injeta nanorrobôs que soldam instantaneamente 25% da integridade do casco."
    },
    "credits_chip": {
        id: "credits_chip",
        name: "Chip de Créditos Estelares",
        category: "PICKUP",
        icon: "💵",
        description: "Moeda digital criptografada. Adiciona fundos imediatamente ao saldo da frota."
    },
    "shield_recharger": {
        id: "shield_recharger",
        name: "Célula de Recarga de Escudo",
        category: "PICKUP",
        icon: "🔵",
        description: "Restaura instantaneamente as células de energia do escudo ativo para capacidade máxima."
    }
};

// Retorna as especificações do item e injeta um fallback seguro caso o ID não exista
export function getItemData(id) {
    return ITEMS_DATABASE[id] || {
        id: "unknown",
        name: "Componente Desconhecido",
        category: "MAT_BASIC",
        icon: "❓",
        description: "Dados corrompidos ou assinatura tecnológica alienígena ilegível."
    };
}