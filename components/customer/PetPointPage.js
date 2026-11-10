import { store } from '../../services/store.js';
import { formatDateTimeDMY } from '../../js/utils/date.js';
import { ASSETS } from '../../js/constants/assets.js';
import { loadTemplate, renderTemplate } from '../../js/html-template.js';

// Markup lives in PetPointPage.html; this file only prepares the data and handlers.
const template = await loadTemplate('../../PetPointPage.html', import.meta.url);

export const PetPointPage = ({ currentUser, onNavigateToBooking, onNavigateToHistory }) => {
  const currentPoints = store.getUserPetPoints(currentUser.id);
  const transactions = store.getPetPointTransactions(currentUser.id);

  return renderTemplate(template, {
    balanceText: currentPoints.toLocaleString('vi-VN'),
    ownerName: currentUser.full_name,
    ownerEmail: currentUser.email,
    pointIconUrl: ASSETS.petPointBalance,
    onNavigateToHistory,
    onNavigateToBooking,
    hasTransactions: transactions.length > 0,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      description: tx.description,
      referenceId: tx.reference_id,
      timeText: formatDateTimeDMY(tx.created_at),
      amountText: tx.amount.toLocaleString('vi-VN')
    }))
  });
};
