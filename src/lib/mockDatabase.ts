import { ScamRecord, EmergencyHotline } from '@/types';

export const INITIAL_SCAM_DATABASE: ScamRecord[] = [];

export const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    name: 'Tổng Đài Bảo Vệ Trẻ Em & Cảnh Báo An Ninh',
    number: '111',
    description: 'Tư vấn, tiếp nhận phản ánh lừa đảo & xâm hại trên không gian mạng',
    icon: 'ShieldAlert',
    badge: 'MIỄN PHÍ 24/7',
  },
  {
    name: 'Cục An Toàn Thông Tin (VNCERT/CC)',
    number: '156',
    description: 'Đầu số phản ánh tin nhắn rác, cuộc gọi rác & lừa đảo viễn thông',
    icon: 'PhoneCall',
    badge: 'BỘ THÔNG TIN & TRUYỀN THÔNG',
  },
  {
    name: 'Đường Dây Nóng Cảnh Sát Hình Sự (C02)',
    number: '069.2348560',
    description: 'Tố giác tội phạm lừa đảo chiếm đoạt tài sản công nghệ cao',
    icon: 'Siren',
    badge: 'BỘ CÔNG AN',
  },
];
