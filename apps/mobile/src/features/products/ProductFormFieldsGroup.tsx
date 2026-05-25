import { ProductFormInput } from "./ProductFormFields";

type ProductFormFieldsGroupProps = {
    name: string;
    merchant: string;
    price: string;
    purchaseDate: string;
    returnDeadline: string;
    warrantyDeadline: string;
    warrantyProvider: string;
    warrantyClaimUrl: string;
    warrantyNotes: string;
    notes: string;
    setName: (value: string) => void;
    setMerchant: (value: string) => void;
    setPrice: (value: string) => void;
    setPurchaseDate: (value: string) => void;
    setReturnDeadline: (value: string) => void;
    setWarrantyDeadline: (value: string) => void;
    setWarrantyProvider: (value: string) => void;
    setWarrantyClaimUrl: (value: string) => void;
    setWarrantyNotes: (value: string) => void;
    setNotes: (value: string) => void;
};

export function ProductFormFieldsGroup({
    name,
    merchant,
    price,
    purchaseDate,
    returnDeadline,
    warrantyDeadline,
    warrantyProvider,
    warrantyClaimUrl,
    warrantyNotes,
    notes,
    setName,
    setMerchant,
    setPrice,
    setPurchaseDate,
    setReturnDeadline,
    setWarrantyDeadline,
    setWarrantyProvider,
    setWarrantyClaimUrl,
    setWarrantyNotes,
    setNotes,
}: ProductFormFieldsGroupProps) {
    return (
        <>
            <ProductFormInput
                label="Product name"
                required
                value={name}
                onChangeText={setName}
                placeholder="Sony WH-1000XM5 Headphones"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Merchant"
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Best Buy"
                autoCapitalize="words"
            />

            <ProductFormInput
                label="Price"
                value={price}
                onChangeText={setPrice}
                placeholder="399.99"
                keyboardType="decimal-pad"
            />

            <ProductFormInput
                label="Purchase date"
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="2026-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Return deadline"
                value={returnDeadline}
                onChangeText={setReturnDeadline}
                placeholder="2026-05-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Warranty deadline"
                value={warrantyDeadline}
                onChangeText={setWarrantyDeadline}
                placeholder="2027-04-28"
                keyboardType="numbers-and-punctuation"
            />

            <ProductFormInput
                label="Warranty Provider"
                value={warrantyProvider}
                onChangeText={setWarrantyProvider}
                placeholder="Best Buy Geek Squad"
            />

            <ProductFormInput
                label="Warranty Claim URL"
                value={warrantyClaimUrl}
                onChangeText={setWarrantyClaimUrl}
                placeholder="https://..."
                autoCapitalize="none"
            />

            <ProductFormInput
                label="Warranty Notes"
                value={warrantyNotes}
                onChangeText={setWarrantyNotes}
                placeholder="Claim instructions, serial number requirements, etc."
                multiline
            />

            <ProductFormInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Warranty card is in the box."
                multiline
            />
        </>
    );
}