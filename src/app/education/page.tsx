'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  scenario: string;
  category: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tip: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Shipper COD 0đ',
    scenario: 'Shipper gọi điện báo bạn có đơn hàng tri ân 0đ từ Shopee, nhưng yêu cầu bạn chuyển khoản trước 120.000đ tiền phí vận chuyển và bảo hiểm vào khoản cá nhân của shipper?',
    options: [
      'A. Chuyển ngay vì phí có 120k để nhận quà tri ân',
      'B. Từ chối nhận, kiểm tra lại ứng dụng Shopee chính thức và tuyệt đối không chuyển khoản cọc',
      'C. Yêu cầu shipper gửi ảnh CCCD rồi mới chuyển tiền',
      'D. Nhấp vào đường link Zalo mà shipper gửi để thanh toán',
    ],
    correctIndex: 1,
    explanation: 'Đây là chiêu trò "Shipper COD 0đ" phổ biến. Shipper chính thống KHÔNG BAO GIỜ yêu cầu khách hàng chuyển khoản cọc phí vận chuyển vào số tài khoản cá nhân ngoài ứng dụng.',
    tip: 'Luôn mở ứng dụng e-commerce (Shopee/Lazada/Tiki) kiểm tra trạng thái đơn hàng thực tế.',
  },
  {
    id: 2,
    category: 'Biên Lai Chuyển Tiền',
    scenario: 'Khách hàng mua đồ gửi ảnh chụp màn hình bill VietinBank iPay báo đã chuyển 5.000.000đ, nhưng ứng dụng ngân hàng của bạn chưa báo số dư. Khách hối thúc bạn giao hàng gấp vì đang bận?',
    options: [
      'A. Giao hàng ngay vì ảnh bill ngân hàng có logo và mã giao dịch rất nét',
      'B. Yêu cầu khách gửi thêm video quay lại màn hình điện thoại',
      'C. Giữ hàng lại, chờ khi nào số dư trên ứng dụng ngân hàng của bạn báo tăng tiền mới giao hàng',
      'D. Đưa mã OTP ngân hàng cho khách để họ hỗ trợ kiểm tra tra cứu tiền treo',
    ],
    correctIndex: 2,
    explanation: 'Ảnh biên lai ngân hàng có thể bị làm giả 100% bằng ứng dụng tạo bill trực tuyến. Quy tắc vàng trong kinh doanh: CHỈ GIAO HÀNG KHI TIỀN ĐÃ VỀ TÀI KHOẢN THỰC TẾ.',
    tip: 'Bật thông báo ứng dụng ngân hàng hoặc kiểm tra lịch sử biến động số dư trực tiếp.',
  },
  {
    id: 3,
    category: 'Deepfake Video Call',
    scenario: 'Bạn bè thân thiết gọi Video Call Zalo cho bạn trong 5 giây (mặt bị giật, tiếng chập chờn rồi tắt), sau đó nhắn tin báo tài khoản bị khóa và nhờ bạn chuyển gấp 15 triệu?',
    options: [
      'A. Chuyển khoản ngay vì vừa nhìn thấy mặt bạn mình trong Video Call',
      'B. Gọi lại bằng số điện thoại di động thông thường hoặc yêu cầu vẫy tay/quay đầu 90 độ trên video call',
      'C. Chuyển trước 5 triệu làm tin rồi hỏi sau',
      'D. Nhấp vào link vay tiền nhanh mà đối phương gửi',
    ],
    correctIndex: 1,
    explanation: 'Kẻ gian dùng công nghệ Deepfake AI ghép mặt/giọng nói video call vài giây để tạo niềm tin. Hãy gọi trực tiếp qua sóng di động thông thường để xác minh với người thân.',
    tip: 'Yêu cầu đối phương vẫy tay ngang qua mặt trên video call để diệt AI Deepfake.',
  },
  {
    id: 4,
    category: 'Giả Danh Công An / VNeID',
    scenario: 'Người xưng là Cán bộ Công an phường gọi điện báo ứng dụng VNeID của bạn bị lỗi mức 2, yêu cầu nhấp vào link trang web dịch vụ công để tải file ứng dụng `.APK` cài đặt thủ công?',
    options: [
      'A. Tải và cài đặt file `.APK` ngay để không bị phạt',
      'B. Cung cấp mã OTP ngân hàng để công an hỗ trợ đồng bộ dữ liệu',
      'C. Cảnh giác ngắt máy, tuyệt đối không cài file `.APK` lạ. Cần hỗ trợ VNeID hãy ra trực tiếp Công an phường',
      'D. Chuyển khoản tiền lệ phí cập nhật hồ sơ VNeID',
    ],
    correctIndex: 2,
    explanation: 'Công an chính thống KHÔNG BAO GIỜ hướng dẫn người dân tải và cài đặt file `.APK` qua đường link lạ. File `.APK` chứa mã độc chiếm quyền điều khiển điện thoại và rút sạch tiền tài khoản ngân hàng.',
    tip: 'Chỉ cài đặt ứng dụng từ Google Play Store hoặc Apple App Store chính thức.',
  },
  {
    id: 5,
    category: 'CTV Nhiệm Vụ Online',
    scenario: 'Bạn được mời tham gia nhóm Telegram làm nhiệm vụ "Thả tim sản phẩm TikTok" nhận 50k/lượt. Sau 2 lần nhận tiền thật, quản trị viên yêu cầu bạn nạp gói 3.000.000đ để nhận hoa hồng 30%?',
    options: [
      'A. Nạp ngay 3 triệu vì 2 lần trước đã rút được tiền thật',
      'B. Rủ thêm bạn bè cùng nạp tiền để chiết khấu cao hơn',
      'C. Nhận biết đây là bẫy lừa đảo CTV, lập tức dừng lại, không nạp thêm bất kỳ chi phí nào',
      'D. Vay tiền ngân hàng để nạp gói cao nhất 50 triệu',
    ],
    correctIndex: 2,
    explanation: 'Đây là mô hình "Bẫy thưởng nhỏ - Chiếm đoạt lớn". Kẻ lừa đảo cho bạn rút vài chục nghìn đầu tiên để tạo niềm tin, sau đó dụ bạn nạp số tiền lớn rồi viện lý do lỗi hệ thống để không cho rút tiền.',
    tip: 'Không có công việc online nhẹ nhàng nào trả hoa hồng phi thực tế 30-50%/ngày.',
  },
];

const CASE_STUDIES = [
  {
    title: 'Vụ án bẫy cài ứng dụng Dịch vụ công giả mạo (Chiếm đoạt 1.2 tỷ)',
    type: 'Mã độc APK',
    summary: 'Nạn nhân nhận cuộc gọi từ kẻ giả danh Cán bộ Thuế yêu cầu cập nhật căn cước công dân. Đối phương gửi link tải app `.APK` giả mạo. Ngay sau khi cài đặt và cấp quyền Accessibility, điện thoại nạn nhân bị điều khiển từ xa và tài khoản ngân hàng bị rút sạch.',
    keyTakeaway: 'KHÔNG BAO GIỜ cài đặt file ứng dụng `.APK` từ đường link do người lạ gửi qua Zalo/SMS.',
  },
  {
    title: 'Vụ án làm giả bill VietinBank iPay mua hàng hiệu (Thiệt hại 180 triệu)',
    type: 'Bill Giả',
    summary: 'Đối tượng đóng vai khách hàng sang trọng đến cửa hàng mua 2 chiếc đồng hồ. Đối tượng dùng app tạo bill giả hiển thị "Chuyển khoản thành công 180 triệu", chụp màn hình cho chủ cửa hàng xem. Chủ cửa hàng tin tưởng giao hàng trước khi kiểm tra số dư thực tế.',
    keyTakeaway: 'Chỉ giao hàng khi tin nhắn biến động số dư ngân hàng chính thức báo tăng tiền.',
  },
  {
    title: 'Vụ án Giả giọng nói Video Call mẹ nhờ con chuyển tiền đi du học (Thiệt hại 300 triệu)',
    type: 'Deepfake AI',
    summary: 'Kẻ lừa đảo thu thập video và giọng nói của người mẹ trên Facebook, sau đó dựng đoạn Video Call Deepfake 6 giây gọi cho người con ở xa. Người con thấy hình ảnh và giọng nói giống hệt mẹ nên lập tức chuyển 300 triệu vào số tài khoản do kẻ gian cung cấp.',
    keyTakeaway: 'Gọi điện thoại di động trực tiếp hoặc hỏi câu hỏi bí mật riêng gia đình để xác minh.',
  },
];

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'cases'>('quiz');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const score = calculateScore();

  return (
    <div className="page-wrap space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <span className="badge-green">
          <span className="material-symbols-outlined text-sm">school</span>
          Chế Độ Giáo Dục & Nâng Cao Cảnh Giác
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl lg:text-4xl">
          Trắc Nghiệm Anti-Scam & Kho Case Study
        </h1>
        <p className="section-sub mx-auto max-w-xl">
          Trải nghiệm các tình huống lừa đảo thực tế để rèn luyện phản xạ phòng thủ an toàn cho bản thân và gia đình.
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex justify-center border-b border-white/10 pb-4">
        <div className="inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'quiz' ? 'bg-primary text-black shadow-glow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">quiz</span>
            Trắc Nghiệm Tương Tác
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'cases' ? 'bg-primary text-black shadow-glow' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">folder_special</span>
            Kho Case Study Thực Tế
          </button>
        </div>
      </div>

      {/* QUIZ TAB */}
      {activeTab === 'quiz' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {showResults && (
            <div className="card p-6 border-primary/40 bg-mesh text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-3xl font-extrabold">
                {score}/{QUIZ_QUESTIONS.length}
              </div>
              <h2 className="font-display text-xl font-bold">
                {score === 5 ? '🏆 Kỹ Năng Anti-Scam Xuất Sắc!' : score >= 3 ? '🛡️ Cảnh Giác Tốt — Cần Phát Huy!' : '⚠️ Cần Nâng Cao Kỹ Năng Phòng Thủ!'}
              </h2>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Bạn đã trả lời đúng {score} trên tổng số {QUIZ_QUESTIONS.length} tình huống lừa đảo phổ biến tại Việt Nam.
              </p>
              <button
                onClick={() => {
                  setUserAnswers({});
                  setShowResults(false);
                }}
                className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Làm lại bài trắc nghiệm
              </button>
            </div>
          )}

          <div className="space-y-5">
            {QUIZ_QUESTIONS.map((q, qIdx) => {
              const selectedOpt = userAnswers[q.id];
              const isSelected = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <div key={q.id} className="card p-5 sm:p-6 space-y-4 border-white/10 hover:border-primary/30 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge-cyan text-[10px] font-mono">Tình huống #{qIdx + 1} · {q.category}</span>
                    {showResults && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                        {isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-sm sm:text-base font-bold text-on-surface leading-relaxed">
                    {q.scenario}
                  </h3>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = 'border-white/10 bg-white/[0.02] text-on-surface-variant hover:border-primary/40 hover:bg-white/[0.05]';
                      if (selectedOpt === optIdx) {
                        btnStyle = 'border-primary bg-primary/10 text-primary font-bold shadow-sm';
                      }
                      if (showResults) {
                        if (optIdx === q.correctIndex) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                        } else if (selectedOpt === optIdx && !isCorrect) {
                          btnStyle = 'border-danger bg-danger/20 text-danger font-bold';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={showResults}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {(isSelected || showResults) && (
                    <div className="rounded-xl bg-black/40 p-3.5 border border-white/10 space-y-1.5 text-xs">
                      <p className="font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                        Phân Tích Kỹ Thuật:
                      </p>
                      <p className="text-on-surface-variant leading-relaxed">{q.explanation}</p>
                      <p className="text-amber text-[11px] font-medium pt-1 border-t border-white/5">
                        💡 Mẹo phòng thủ: {q.tip}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showResults && (
            <div className="text-center pt-2">
              <button
                disabled={Object.keys(userAnswers).length < QUIZ_QUESTIONS.length}
                onClick={() => setShowResults(true)}
                className="btn-primary px-8 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xem Kết Quả Trắc Nghiệm ({Object.keys(userAnswers).length}/{QUIZ_QUESTIONS.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* CASE STUDIES TAB */}
      {activeTab === 'cases' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {CASE_STUDIES.map((cs, idx) => (
            <div key={idx} className="card p-5 space-y-3 border-danger/30 bg-danger/5">
              <div className="flex items-center justify-between">
                <span className="badge-danger font-mono text-[10px]">{cs.type}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">Case Study #{idx + 1}</span>
              </div>

              <h3 className="font-display text-base font-bold text-on-surface">{cs.title}</h3>
              <p className="text-xs leading-relaxed text-on-surface-variant">{cs.summary}</p>

              <div className="rounded-xl bg-black/50 p-3 border border-white/10 text-xs">
                <p className="font-bold text-primary flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Bài Học Kinh Nghiệm:
                </p>
                <p className="text-on-surface font-medium">{cs.keyTakeaway}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
