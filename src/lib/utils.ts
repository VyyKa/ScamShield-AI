import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ThreatSample } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(score: number): {
  text: string;
  bg: string;
  border: string;
  label: string;
} {
  if (score >= 75) {
    return {
      text: 'text-danger',
      bg: 'bg-danger-soft',
      border: 'border-danger/30',
      label: 'Nguy hiểm cao — dấu hiệu lừa đảo',
    };
  } else if (score >= 40) {
    return {
      text: 'text-amber',
      bg: 'bg-amber-soft',
      border: 'border-amber/30',
      label: 'Nghi vấn — cần xác minh thêm',
    };
  } else {
    return {
      text: 'text-primary',
      bg: 'bg-primary-soft',
      border: 'border-primary/30',
      label: 'Tương đối an toàn',
    };
  }
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const PRESET_SAMPLES: ThreatSample[] = [
  {
    id: 'sample-fake-bill',
    title: 'Hóa Đơn Chuyển Khoản VCB 50 Triệu (Giả Mạo)',
    subMode: 'fake_bill',
    description: 'Biên nhận ngân hàng Vietcombank chuyển tiền mua hàng online 50,000,000đ nhưng phông chữ lệch và QR giả.',
    sampleText: 'VIETCOMBANK - Giao dịch thành công. Số tiền: 50.000.000 VND. Tên người nhận: NGUYEN VAN A. Nôi dung: Thanh toan tien mua dong ho. Ma GD: VCB987654321.',
    mockResult: {
      isScam: true,
      riskScore: 95,
      redFlags: [
        'Sai lệch phông chữ chuẩn số tiền của hệ thống Vietcombank Mobile Banking',
        'Khoảng cách giữa các dòng chữ không đều (có dấu vết cắt ghép photoshop)',
        'Mã giao dịch VCB987654321 trùng với danh sách đen cảnh báo lừa đảo',
        'Tài khoản ngân hàng chưa nhận được thông báo biến động số dư thực tế'
      ],
      analysisDetails: 'Hóa đơn chuyển khoản này có đầy đủ các dấu hiệu cắt ghép kỹ thuật số (Photoshop/Canva). Kẻ gian tạo biên nhận chuyển tiền giả để hối thúc bạn giao hàng hoặc trả lại tiền thừa.',
      recommendedAction: 'KHÔNG GIAO HÀNG và KHÔNG CHUYỂN TIỀN LẠI. Hãy kiểm tra ứng dụng ngân hàng thực tế của bạn hoặc tổng đài Vietcombank trước khi thực hiện bất kỳ thao tác nào.'
    }
  },
  {
    id: 'sample-shipper-cod',
    title: 'Tin Nhắn Shipper Giao Hàng COD 480k (Giả Shipper)',
    subMode: 'shipper_cross',
    description: 'SMS/Zalo từ số lạ thông báo có đơn hàng Shopee 480k cần chuyển khoản cọc hoặc nhận thay.',
    sampleText: 'Em shipper Shopee Express day a. Anh co don hang 480.000d giao den nha nhung anh vang mat. Anh chuyen khoan qua STK 1903xxx de em gui bao ve giu giup nhe.',
    mockResult: {
      isScam: true,
      riskScore: 88,
      redFlags: [
        'Mã đơn hàng và tên shop không trùng khớp với ứng dụng Shopee/TikTok Shop của bạn',
        'Yêu cầu chuyển khoản cá nhân thay vì thanh toán qua ứng dụng chính thức',
        'Cố tình thúc ép chuyển khoản nhanh vì "đang đứng ngoài nắng"',
        'Số điện thoại nhắn tin không nằm trong danh sách shipper đã từng giao cho bạn'
      ],
      analysisDetails: 'Chiêu thức giả danh Shipper giao đơn COD. Kẻ lừa đảo mua thông tin đơn hàng bị lộ hoặc gửi ngẫu nhiên. Nếu bạn chuyển khoản, shipper giả sẽ chặn số ngay lập tức.',
      recommendedAction: 'Mở app e-commerce (Shopee/Lazada) kiểm tra trạng thái đơn thực tế. Từ chối nhận và chuyển khoản nếu đơn không tồn tại trên hệ thống.'
    }
  },
  {
    id: 'sample-investment-poster',
    title: 'Poster Đầu Tư Tài Chính "Việc Nhẹ Lương Cao 2 Triệu/Ngày"',
    subMode: 'physical_poster',
    description: 'Tờ rơi / Banner tuyển dụng xem video TikTok kiếm 500k - 2 triệu/ngày, cam kết bảo toàn vốn 100%.',
    sampleText: 'TẬP ĐOÀN ĐẦU TƯ TÀI CHÍNH TẬN TÂM - Tuyển cộng tác viên xem video Shopee/TikTok. Thu nhập 500k-2tr/ngày. Cam kết bảo toàn vốn 100%. Nhắn Zalo 0987xxx để nhận việc ngay!',
    mockResult: {
      isScam: true,
      riskScore: 99,
      redFlags: [
        'Hứa hẹn lợi nhuận bất thường (lên đến 300%/tháng) không có rủi ro',
        'Dùng danh nghĩa thương hiệu lớn (Shopee/TikTok) nhưng yêu cầu liên hệ Zalo cá nhân',
        'Mô hình đa cấp biến tướng (nạp tiền vào sàn ảo để làm nhiệm vụ)',
        'Dark Pattern thao túng tâm lý: "Tuyển gấp trong 24h", "Cam kết 100%"'
      ],
      analysisDetails: 'Đây là kịch bản lừa đảo nhiệm vụ nạp tiền điển hình (Bẫy tuyển cộng tác viên). Ban đầu kẻ lừa đảo sẽ cho bạn rút 50k-100k để tạo niềm tin, sau đó yêu cầu nạp hàng chục triệu và khóa tài khoản.',
      recommendedAction: 'CẢNH BÁO TỐI CAO: Tuyệt đối không nạp tiền làm nhiệm vụ. Báo cáo bài đăng/tờ rơi cho cơ quan chức năng hoặc công an địa phương.'
    }
  }
];
