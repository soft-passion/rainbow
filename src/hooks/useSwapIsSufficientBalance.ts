import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExchangeModalType } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { greaterThanOrEqualTo } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapIsSufficientBalance(inputAmount: string | null) {
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const assets = useSelector((state: AppState) => state.data.assets);
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.[ExchangeModalType.withdrawCompound]
        ?.supplyBalanceUnderlying
  );

  const isSufficientBalance = useMemo(() => {
    if (!inputAmount) return true;

    const maxInputBalance =
      ethereumUtils.getAsset(assets, inputCurrencyAddress)?.balance?.amount ??
      0;

    const isWithdrawal = type === ExchangeModalType.withdrawCompound;

    return isWithdrawal
      ? greaterThanOrEqualTo(supplyBalanceUnderlying, inputAmount)
      : greaterThanOrEqualTo(maxInputBalance, inputAmount);
  }, [
    assets,
    inputAmount,
    inputCurrencyAddress,
    supplyBalanceUnderlying,
    type,
  ]);

  return isSufficientBalance;
}
