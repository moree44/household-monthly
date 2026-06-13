# Manual Testing Checklist

Use this after pulling changes, before serious use, and before Vercel deploy.

Status:

- Last full manual test: 2026-06-13
- Tester: moree
- Result: pass
- Environment: PC WSL + Cloudflare Tunnel + iPhone/PWA

## Local Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Basic App

- [x] Login as `suami`.
- [x] Dashboard opens.
- [x] Month selector previous/next works.
- [x] Bottom navigation works:
  - [x] home
  - [x] history
  - [x] catat
  - [x] goals
  - [x] profil

## Expense Flow

- [x] Create expense from Catat.
- [x] Expense appears in Dashboard Recent Transactions.
- [x] Expense appears in History Active.
- [x] Operational expense increases.
- [x] Wallet balance decreases.
- [x] Edit expense amount/category/wallet/note/date.
- [x] Dashboard and History reflect edited expense.
- [x] Delete expense from History.
- [x] Expense disappears from Active.
- [x] Expense appears in Deleted.
- [x] Wallet balance and monthly summary exclude deleted expense.
- [x] Restore expense.
- [x] Expense returns to Active.
- [x] Wallet balance and monthly summary include restored expense.

## Transfer Flow

- [x] Create transfer from one wallet to another.
- [x] Transfer appears in Dashboard Recent Transactions.
- [x] Transfer appears in History Active.
- [x] Source wallet decreases.
- [x] Destination wallet increases.
- [x] Operational expense does not increase.
- [x] Edit transfer amount/from/to/note/date.
- [x] Dashboard and History reflect edited transfer.
- [x] Delete transfer.
- [x] Wallet balances exclude deleted transfer.
- [x] Restore transfer.
- [x] Wallet balances include restored transfer.

## Top Up Flow

- [x] Create top up from source account to wallet.
- [x] Top up appears in Dashboard Recent Transactions.
- [x] Top up appears in History Active.
- [x] Destination wallet increases.
- [x] Operational expense does not increase.
- [x] Edit top up amount/source/wallet/note/date.
- [x] Dashboard and History reflect edited top up.
- [x] Delete top up.
- [x] Wallet balance excludes deleted top up.
- [x] Restore top up.
- [x] Wallet balance includes restored top up.

## History

- [x] Filter Active works.
- [x] Filter Deleted works.
- [x] Type filter works for Active.
- [x] Type filter works for Deleted.
- [x] Weekly filter works:
  - [x] W1 = 1-7
  - [x] W2 = 8-14
  - [x] W3 = 15-21
  - [x] W4 = 22-end of month
- [x] Notes are visible but compact.
- [x] Delete/restore confirm does not overflow on mobile.

## Goals

- [x] Create goal.
- [x] Edit current amount.
- [x] Edit target amount.
- [x] Progress changes correctly.
- [x] Deactivate goal.
- [x] Reactivate goal.
- [x] Auto icon matches known names:
  - [x] Dana Darurat
  - [x] Tabungan Rumah
  - [x] Liburan

## Profile / Settings

- [x] Kelola Pengguna opens.
- [x] User display name can be edited.
- [x] User password can be changed.
- [x] User can be deactivated/reactivated where allowed.
- [x] Kelola Wallet opens.
- [x] Wallet can be added/edited/deactivated.
- [x] Kelola Kategori opens.
- [x] Category can be added/edited/deactivated.
- [x] Security page opens.
- [x] Appearance page opens.

## iPhone / PWA

- [x] Open app in Safari.
- [x] Add to Home Screen.
- [x] App icon appears correctly.
- [x] App opens in standalone mode.
- [x] Top safe-area has no overlap.
- [x] Bottom nav has no overlap with home indicator.
- [x] Catat page is fast enough for daily input.
- [x] Route transitions feel acceptable.
