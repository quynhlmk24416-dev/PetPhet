import { loadTemplate, renderTemplate } from '../../js/html-template.js';

// Markup lives in AboutPage.html; this file only holds the content lists and handlers.
const template = await loadTemplate('../../AboutPage.html', import.meta.url);

const carePrinciples = [
  {
    icon: 'Heart',
    title: 'Tận tâm với từng bé',
    description: 'Lựa chọn cách chăm sóc phù hợp với nhu cầu của mỗi thú cưng.'
  },
  {
    icon: 'ShieldCheck',
    title: 'Thông tin rõ ràng',
    description: 'Dịch vụ, lịch hẹn và thông tin chăm sóc được trình bày dễ theo dõi.'
  },
  {
    icon: 'PawPrint',
    title: 'Thuận tiện cho người nuôi',
    description: 'Quản lý hồ sơ và đặt lịch dịch vụ trong cùng một nơi.'
  }
];

const coreValues = [
  { title: 'Tiện lợi', description: 'Tập trung thông tin và chức năng đặt lịch trên một nền tảng.' },
  { title: 'Minh bạch', description: 'Công khai thông tin dịch vụ, giá, lịch hoạt động và đánh giá.' },
  { title: 'Tận tâm', description: 'Quan tâm đến nhu cầu và trải nghiệm của thú cưng lẫn chủ nuôi.' },
  { title: 'Kết nối', description: 'Gắn kết chủ nuôi với các cơ sở cung cấp dịch vụ phù hợp.' },
  { title: 'Đổi mới', description: 'Ứng dụng công nghệ để hỗ trợ đặt lịch, quản lý và tư vấn.' }
];

export const AboutPage = ({ onNavigateToBooking, onNavigateToServices }) =>
  renderTemplate(template, {
    onNavigateToBooking,
    onNavigateToServices,
    coreValues: coreValues.map((value, index) => ({ ...value, number: String(index + 1).padStart(2, '0') })),
    principles: carePrinciples
  });
