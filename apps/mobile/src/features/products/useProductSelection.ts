import { useCallback, useState } from "react";

export function useProductSelection() {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const resetSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedProductIds([]);
    }, []);

    const toggleSelectionMode = useCallback(() => {
        setSelectionMode((currentSelectionMode) => {
            setSelectedProductIds([]);
            return !currentSelectionMode;
        });
    }, []);

    const toggleSelectedProduct = useCallback((productId: number) => {
        setSelectedProductIds((currentSelectedProductIds) => {
            if (currentSelectedProductIds.includes(productId)) {
                return currentSelectedProductIds.filter(
                    (selectedProductId) => selectedProductId !== productId
                );
            }

            return [...currentSelectedProductIds, productId];
        });
    }, []);

    return {
        selectionMode,
        selectedProductIds,
        resetSelection,
        toggleSelectionMode,
        toggleSelectedProduct,
    };
}