import { ITEMS_DATABASE, getItemData } from "../systems/ItemsDB";

/**
 * Transfere um item específico do painel de Loot para o inventário (Storage) do jogador.
 * * @param {number} lootIndex - O índice do item na grade de loot (0 a 11).
 * @param {Array} currentLoot - O array de estado atual do LootPanel.
 * @param {Array} currentStorage - O array de estado atual do InventorySystem (storageSlots).
 * @returns {Object|null} Retorna um objeto com os novos estados { updatedLoot, updatedStorage } ou null se falhar.
 */
export function transferLootToStorage(lootIndex, currentLoot, currentStorage) {
    const itemToTransfer = currentLoot[lootIndex];

    // 1. Validação de Segurança (Mecânica Tarkov)
    if (!itemToTransfer) return null;
    if (!itemToTransfer.revealed) {
        console.warn("⚠️ [CONEXÃO EM RISCO]: Tentativa de transferir hardware não identificado.");
        return null;
    }

    const itemStaticData = getItemData(itemToTransfer.id);

    // Clonagem profunda dos estados para evitar mutações diretas no React
    let updatedLoot = [...currentLoot];
    let updatedStorage = [...currentStorage];

    // Remove o item do slot de loot (limpa o slot mantendo a posição da matriz)
    updatedLoot[lootIndex] = null;

    // 2. Regra de Negócio: Verificação de Empacotamento (Stack)
    // Apenas materiais/recursos acumulam na mesma célula. Equipamentos geram slots isolados.
    const isStackable = itemStaticData.category.startsWith("MAT_") || itemStaticData.category === "PICKUP";

    if (isStackable) {
        // Procura se já existe esse recurso no inventário para somar a quantidade
        const existingSlotIndex = updatedStorage.findIndex(
            (slot) => slot && slot.id === itemToTransfer.id
        );

        if (existingSlotIndex > -1) {
            updatedStorage[existingSlotIndex] = {
                ...updatedStorage[existingSlotIndex],
                qty: updatedStorage[existingSlotIndex].qty + itemToTransfer.qty
            };
            return { updatedLoot, updatedStorage };
        }
    }

    // 3. Alocação em Novo Slot Vazio
    const firstEmptySlot = updatedStorage.findIndex((slot) => slot === null);

    if (firstEmptySlot === -1) {
        console.warn("❌ [COMPARTIMENTO CHEIO]: Carga excedeu o limite do armazenamento secundário.");
        return null; // Bloqueia a transferência se o inventário estiver cheio
    }

    // Insere o item na primeira vaga disponível
    updatedStorage[firstEmptySlot] = {
        id: itemToTransfer.id,
        qty: itemToTransfer.qty,
        // Se for um equipamento, inicializa ou herda propriedades estruturais
        ...(itemToTransfer.hasDurability && {
            hasDurability: true,
            durability: itemToTransfer.durability ?? 100
        }),
        // Preserva metadados estéticos (como raridades específicas vindas do RNG)
        ...(itemToTransfer.rarity && { rarity: itemToTransfer.rarity })
    };

    return { updatedLoot, updatedStorage };
}

/**
 * Retorna o loot fixo inicial projetado especificamente para o Tutorial.
 * @returns {Array} Matriz de 12 slots para a grade de loot.
 */
export function generateTutorialLoot() {
    // Inicializa a grade de loot vazia (12 slots)
    const lootGrid = Array(12).fill(null);

    // 1. Uma arma com 32% de durabilidade
    lootGrid[0] = {
        id: "laser_vx",
        qty: 1,
        revealed: false,
        hasDurability: true,
        durability: 32
    };

    // 2. Três peças comuns (MAT_BASIC)
    lootGrid[1] = { id: "carbon_fragment", qty: 3, revealed: false };
    lootGrid[2] = { id: "iron_ore", qty: 1, revealed: false };

    return lootGrid;
}

/**
 * Gera um pacote de loot completamente aleatório baseado no banco de dados.
 * @returns {Array} Matriz de 12 slots com itens aleatórios.
 */
export function generateRandomLoot() {
    const lootGrid = Array(12).fill(null);
    const allItemIds = Object.keys(ITEMS_DATABASE);

    // Determina quantos itens vão dropar (ex: entre 2 e 5 itens)
    const itemsCount = Math.floor(Math.random() * 4) + 2;

    // Sorteia posições únicas na grade de loot
    const chosenSlots = [];
    while (chosenSlots.length < itemsCount) {
        const slot = Math.floor(Math.random() * 12);
        if (!chosenSlots.includes(slot)) chosenSlots.push(slot);
    }

    chosenSlots.forEach((slotIndex) => {
        // Sorteia um ID aleatório do banco de dados
        const randomId = allItemIds[Math.floor(Math.random() * allItemIds.length)];
        const itemData = ITEMS_DATABASE[randomId];

        // Define quantidade baseada na categoria
        let qty = 1;
        if (itemData.category.startsWith("MAT_BASIC")) qty = Math.floor(Math.random() * 10) + 1;
        else if (itemData.category.startsWith("MAT_MEDIUM")) qty = Math.floor(Math.random() * 4) + 1;

        // Monta o objeto do item de loot
        lootGrid[slotIndex] = {
            id: randomId,
            qty: qty,
            revealed: true, // Altere para false se o jogador precisar "escanear" antes de ver
            ...(itemData.slotType && { hasDurability: true, durability: Math.floor(Math.random() * 60) + 40 })
        };
    });

    return lootGrid;
}