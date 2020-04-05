import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useDimensions } from '../../hooks';
import { padding } from '../../styles';
import { runSpring } from '../animations';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
import AddCashFooter from './AddCashFooter';
import AddCashSelector from './AddCashSelector';

const { Clock } = Animated;

const currencies = ['DAI', 'ETH'];
const initialCurrencyIndex = 0;

const AddCashForm = ({
  limitDaily,
  limitYearly,
  onClearError,
  onLimitExceeded,
  onPurchase,
  onShake,
  shakeAnim,
}) => {
  const { isNarrowPhone, isSmallPhone, isTinyPhone } = useDimensions();
  const [scaleAnim, setScaleAnim] = useState(1);
  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState(null);

  const handlePurchase = useCallback(() => {
    analytics.track('Submitted Purchase', {
      category: 'add cash',
      label: currency,
      value: Number(value),
    });
    return onPurchase({ currency, value });
  }, [currency, onPurchase, value]);

  const handleNumpadPress = useCallback(
    newValue => {
      setValue(prevValue => {
        const isExceedingDailyLimit =
          parseFloat(prevValue + `${parseFloat(newValue)}`) > limitDaily;

        const isExceedingYearlyLimit =
          parseFloat(prevValue + `${parseFloat(newValue)}`) > limitYearly;

        const isInvalidFirstEntry =
          !prevValue &&
          (newValue === '0' || newValue === '.' || newValue === 'back');

        const isMaxDecimalCount =
          prevValue && prevValue.includes('.') && newValue === '.';

        const isMaxDecimalLength =
          prevValue &&
          prevValue.charAt(prevValue.length - 3) === '.' &&
          newValue !== 'back';

        if (
          isExceedingDailyLimit ||
          isExceedingYearlyLimit ||
          isInvalidFirstEntry ||
          isMaxDecimalCount ||
          isMaxDecimalLength
        ) {
          if (isExceedingDailyLimit) onLimitExceeded('daily');
          if (isExceedingYearlyLimit) onLimitExceeded('yearly');
          onShake();
          return prevValue;
        }

        let nextValue = prevValue;
        if (nextValue === null) {
          nextValue = newValue;
        } else if (newValue === 'back') {
          nextValue = prevValue.slice(0, -1);
        } else {
          nextValue += newValue;
        }

        onClearError();

        let prevPosition = 1;
        if (prevValue && prevValue.length > 3) {
          prevPosition = 1 - (prevValue.length - 3) * 0.075;
        }
        if (nextValue.length > 3) {
          const characterCount = 1 - (nextValue.length - 3) * 0.075;
          setScaleAnim(
            runSpring(new Clock(), prevPosition, characterCount, 0, 400, 40)
          );
        } else if (nextValue.length == 3) {
          setScaleAnim(runSpring(new Clock(), prevPosition, 1, 0, 400, 40));
        }

        return nextValue;
      });

      analytics.track('Updated cash amount', {
        category: 'add cash',
      });
    },
    [limitDaily, limitYearly, onClearError, onLimitExceeded, onShake]
  );

  const onCurrencyChange = useCallback(val => {
    setCurrency(val);
    analytics.track('Switched currency to purchase', {
      category: 'add cash',
      label: val,
    });
  }, []);

  return (
    <Fragment>
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          css={padding(0, 24, isNarrowPhone ? 12 : 24)}
          justify="center"
          margin={isSmallPhone ? -2 : 8}
          width="100%"
        >
          <NumpadValue scale={scaleAnim} translateX={shakeAnim} value={value} />
          <AddCashSelector
            currencies={currencies}
            initialCurrencyIndex={initialCurrencyIndex}
            onSelect={onCurrencyChange}
          />
        </ColumnWithMargins>
      </Centered>
      <ColumnWithMargins align="center" margin={isTinyPhone ? 15 : 27}>
        <Centered maxWidth={313}>
          <Numpad
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </Centered>
        <AddCashFooter
          disabled={isEmpty(value) || parseFloat(value) === 0}
          onDisabledPress={onShake}
          onSubmit={handlePurchase}
        />
      </ColumnWithMargins>
    </Fragment>
  );
};

AddCashForm.propTypes = {
  limitDaily: PropTypes.number,
  limitYearly: PropTypes.number,
  onClearError: PropTypes.func,
  onLimitExceeded: PropTypes.func,
  onPurchase: PropTypes.func,
  onShake: PropTypes.func,
  shakeAnim: PropTypes.object,
};

export default React.memo(AddCashForm);