# Manual Testing Checklist

Use this after pulling changes, before serious use, and before Vercel deploy.

## Local Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Basic App

- [ ] Login as `suami`.
- [ ] Dashboard opens.
- [ ] Month selector previous/next works.
- [ ] Bottom navigation works:
  - [ ] home
  - [ ] history
  - [ ] catat
  - [ ] goals
  - [ ] profil

## Expense Flow

- [ ] Create expense from Catat.
- [ ] Expense appears in Dashboard Recent Transactions.
- [ ] Expense appears in History Active.
- [ ] Operational expense increases.
- [ ] Wallet balance decreases.
- [ ] Edit expense amount/category/wallet/note/date.
- [ ] Dashboard and History reflect edited expense.
- [ ] Delete expense from History.
- [ ] Expense disappears from Active.
- [ ] Expense appears in Deleted.
- [ ] Wallet balance and monthly summary exclude deleted expense.
- [ ] Restore expense.
- [ ] Expense returns to Active.
- [ ] Wallet balance and monthly summary include restored expense.

## Transfer Flow

- [ ] Create transfer from one wallet to another.
- [ ] Transfer appears in Dashboard Recent Transactions.
- [ ] Transfer appears in History Active.
- [ ] Source wallet decreases.
- [ ] Destination wallet increases.
- [ ] Operational expense does not increase.
- [ ] Edit transfer amount/from/to/note/date.
- [ ] Dashboard and History reflect edited transfer.
- [ ] Delete transfer.
- [ ] Wallet balances exclude deleted transfer.
- [ ] Restore transfer.
- [ ] Wallet balances include restored transfer.

## Top Up Flow

- [ ] Create top up from source account to wallet.
- [ ] Top up appears in Dashboard Recent Transactions.
- [ ] Top up appears in History Active.
- [ ] Destination wallet increases.
- [ ] Operational expense does not increase.
- [ ] Edit top up amount/source/wallet/note/date.
- [ ] Dashboard and History reflect edited top up.
- [ ] Delete top up.
- [ ] Wallet balance excludes deleted top up.
- [ ] Restore top up.
- [ ] Wallet balance includes restored top up.

## History

- [ ] Filter Active works.
- [ ] Filter Deleted works.
- [ ] Type filter works for Active.
- [ ] Type filter works for Deleted.
- [ ] Weekly filter works:
  - [ ] W1 = 1-7
  - [ ] W2 = 8-14
  - [ ] W3 = 15-21
  - [ ] W4 = 22-end of month
- [ ] Notes are visible but compact.
- [ ] Delete/restore confirm does not overflow on mobile.

## Goals

- [ ] Create goal.
- [ ] Edit current amount.
- [ ] Edit target amount.
- [ ] Progress changes correctly.
- [ ] Deactivate goal.
- [ ] Reactivate goal.
- [ ] Auto icon matches known names:
  - [ ] Dana Darurat
  - [ ] Tabungan Rumah
  - [ ] Liburan

## Profile / Settings

- [ ] Kelola Pengguna opens.
- [ ] User display name can be edited.
- [ ] User password can be changed.
- [ ] User can be deactivated/reactivated where allowed.
- [ ] Kelola Wallet opens.
- [ ] Wallet can be added/edited/deactivated.
- [ ] Kelola Kategori opens.
- [ ] Category can be added/edited/deactivated.
- [ ] Security page opens.
- [ ] Appearance page opens.

## iPhone / PWA

- [ ] Open app in Safari.
- [ ] Add to Home Screen.
- [ ] App icon appears correctly.
- [ ] App opens in standalone mode.
- [ ] Top safe-area has no overlap.
- [ ] Bottom nav has no overlap with home indicator.
- [ ] Catat page is fast enough for daily input.
- [ ] Route transitions feel acceptable.
