export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatShortTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

export const formatFullDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
};

export const getElapsedMinutes = (isoString: string): number => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
};

export const formatTableDisplay = (
  orderOrTableNum: { tableNumber?: number; joinedTableNumbers?: number[] } | number | undefined,
  compact = false
): string => {
  if (!orderOrTableNum) return 'Meja -';

  if (typeof orderOrTableNum === 'number') {
    return compact ? `#${orderOrTableNum}` : `Meja #${orderOrTableNum}`;
  }

  const { tableNumber, joinedTableNumbers } = orderOrTableNum;
  const tables = joinedTableNumbers && joinedTableNumbers.length > 0 
    ? Array.from(new Set(joinedTableNumbers)).sort((a, b) => a - b)
    : tableNumber ? [tableNumber] : [];

  if (tables.length === 0) return 'Meja -';
  if (tables.length === 1) return compact ? `#${tables[0]}` : `Meja #${tables[0]}`;

  const tableStr = tables.map((t) => `#${t}`).join(' + ');
  if (compact) {
    return `${tableStr} (Gabung)`;
  }
  return `Meja ${tableStr} (Gabung ${tables.length} Meja)`;
};
