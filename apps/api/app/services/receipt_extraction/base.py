from abc import ABC, abstractmethod

from app.services.receipt_extraction.types import ReceiptExtractionResult


class ReceiptExtractionProvider(ABC):
    @abstractmethod
    def extract(self, raw_text: str) -> ReceiptExtractionResult:
        raise NotImplementedError