import { storage } from '../services/storage';
import { useAppStore } from '../store';

export const formatCurrency = (amount: number, forceShow = false) => {
    const isDiscreteMode = useAppStore.getState().isDiscreteMode;
    const settings = storage.getSettings();
    const map: Record<string, { symbol: string, locale: string }> = {
        'PKR': { symbol: 'Rs.', locale: 'en-PK' },
        'USD': { symbol: '$', locale: 'en-US' },
        'INR': { symbol: '₹', locale: 'en-IN' },
        'EUR': { symbol: '€', locale: 'de-DE' }
    };
    const c = map[settings.currency] || map['PKR'];
    if (isDiscreteMode && !forceShow) {
        return `${c.symbol} ***`;
    }
    const realAmount = Math.floor(amount / 100);
    return `${c.symbol} ${realAmount.toLocaleString(c.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const getCurrencySymbol = () => {
    const settings = storage.getSettings();
    const map: Record<string, string> = {
        'PKR': 'Rs.',
        'USD': '$',
        'INR': '₹',
        'EUR': '€'
    };
    return map[settings.currency] || 'Rs.';
};
