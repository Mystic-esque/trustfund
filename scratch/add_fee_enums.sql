-- Add the new fee types to ledger_entry_type enum
ALTER TYPE ledger_entry_type ADD VALUE 'TOPUP_FEE';
ALTER TYPE ledger_entry_type ADD VALUE 'PAYOUT_FEE';
