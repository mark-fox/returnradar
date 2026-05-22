import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    listArchivedProducts,
    restoreProduct,
} from "@/src/features/products/api";
import { Product } from "@/src/features/products/types";

export default function ArchivedProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);

    async function loadProducts() {
        const archivedProducts =
            await listArchivedProducts();

        setProducts(
            archivedProducts.filter(
                (product) => product.is_archived
            )
        );
    }

    async function handleRestore(
        productId: number,
    ) {
        await restoreProduct(productId);

        await loadProducts();
    }

    useEffect(() => {
        void loadProducts();
    }, []);

    return (
        <FlatList
            contentContainerStyle={styles.container}
            data={products}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
                <View>
                    <Text style={styles.title}>
                        Archived Products
                    </Text>

                    <Text style={styles.subtitle}>
                        Previously archived products can
                        be restored later.
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.name}>
                        {item.name}
                    </Text>

                    <Text style={styles.meta}>
                        {item.merchant ?? "Unknown merchant"}
                    </Text>

                    <Pressable
                        style={styles.restoreButton}
                        onPress={() =>
                            handleRestore(item.id)
                        }
                    >
                        <Text style={styles.restoreButtonText}>
                            Restore Product
                        </Text>
                    </Pressable>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F8FAFC",
        padding: 24,
        paddingBottom: 120,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
        marginBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    name: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    meta: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 14,
    },
    restoreButton: {
        backgroundColor: "#0F172A",
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    restoreButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
});