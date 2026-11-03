/**
 * 박규리 인터랙티브 웹 명함 (Digital Business Card)
 * JavaScript Interactions & Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. DOM 요소 캐싱
  // --------------------------------------------------------------------------
  const card = document.getElementById('businessCard');
  const cardContainer = document.querySelector('.card-container');
  const themeToggle = document.getElementById('themeToggle');
  const emailCopyCard = document.getElementById('emailCopyCard');
  const emailText = document.getElementById('emailText').textContent.trim();
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const vcardBtn = document.getElementById('vcardBtn');
  const shareBtn = document.getElementById('shareBtn');
  const qrBtn = document.getElementById('qrBtn');
  const qrModal = document.getElementById('qrModal');
  const closeQrModal = document.getElementById('closeQrModal');
  const qrcodeContainer = document.getElementById('qrcode');
  
  // 캐릭터 눈동자 요소
  const leftPupil = document.getElementById('leftPupil');
  const rightPupil = document.getElementById('rightPupil');
  const characterSvg = document.querySelector('.character-svg');

  let qrCodeInstance = null;
  let toastTimeout = null;

  // --------------------------------------------------------------------------
  // 2. 다크 모드 / 라이트 모드 관리
  // --------------------------------------------------------------------------
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeIcon(true);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      updateThemeIcon(false);
    }
  };

  const updateThemeIcon = (isDark) => {
    const icon = themeToggle.querySelector('i');
    if (isDark) {
      icon.className = 'fa-solid fa-sun';
      themeToggle.title = '라이트 모드로 전환';
    } else {
      icon.className = 'fa-solid fa-moon';
      themeToggle.title = '다크 모드로 전환';
    }
  };

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme === 'dark');
    showToast(newTheme === 'dark' ? '🌙 다크 모드로 변경되었습니다.' : '☀️ 라이트 모드로 변경되었습니다.');
  });

  initTheme();

  // --------------------------------------------------------------------------
  // 3. 캐릭터 눈동자 시선 추적 (Interactive Eye Tracking)
  // --------------------------------------------------------------------------
  const handleEyeTracking = (clientX, clientY) => {
    if (!characterSvg || !leftPupil || !rightPupil) return;

    const svgRect = characterSvg.getBoundingClientRect();
    const svgCenterX = svgRect.left + svgRect.width / 2;
    const svgCenterY = svgRect.top + svgRect.height / 2;

    const deltaX = clientX - svgCenterX;
    const deltaY = clientY - svgCenterY;

    // 각도 및 거리 계산
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.hypot(deltaX, deltaY);
    
    // 눈동자 최대 이동 반경 (px)
    const maxRadius = 3.6;
    const moveRadius = Math.min(distance / 25, maxRadius);

    const pupilX = Math.cos(angle) * moveRadius;
    const pupilY = Math.sin(angle) * moveRadius;

    // 왼쪽 및 오른쪽 눈동자 이동
    leftPupil.setAttribute('transform', `translate(${pupilX.toFixed(2)}, ${pupilY.toFixed(2)})`);
    rightPupil.setAttribute('transform', `translate(${pupilX.toFixed(2)}, ${pupilY.toFixed(2)})`);
  };

  window.addEventListener('mousemove', (e) => {
    handleEyeTracking(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handleEyeTracking(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // 마우스가 화면을 벗어날 때 중앙으로 원복
  document.addEventListener('mouseleave', () => {
    if (leftPupil && rightPupil) {
      leftPupil.setAttribute('transform', 'translate(0, 0)');
      rightPupil.setAttribute('transform', 'translate(0, 0)');
    }
  });

  // --------------------------------------------------------------------------
  // 4. 3D 카드 틸트 (Card 3D Tilt Effect)
  // --------------------------------------------------------------------------
  if (card && cardContainer) {
    let isHovering = false;

    cardContainer.addEventListener('mouseenter', () => {
      isHovering = true;
    });

    cardContainer.addEventListener('mousemove', (e) => {
      if (!isHovering) return;
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 기울기 각도 계산 (최대 ±8도)
      const rotateX = ((centerY - y) / centerY) * 7.5;
      const rotateY = ((x - centerX) / centerX) * 7.5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    cardContainer.addEventListener('mouseleave', () => {
      isHovering = false;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  }

  // --------------------------------------------------------------------------
  // 5. 토스트 알림 헬퍼
  // --------------------------------------------------------------------------
  const showToast = (message) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // --------------------------------------------------------------------------
  // 6. 이메일 주소 복사 기능
  // --------------------------------------------------------------------------
  emailCopyCard.addEventListener('click', async () => {
    const copyBtnIcon = emailCopyCard.querySelector('.copy-action-btn i');
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(emailText);
      } else {
        // 비보안 컨텍스트 폴백
        const textArea = document.createElement('textarea');
        textArea.value = emailText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      // 복사 성공 UI 피드백
      copyBtnIcon.className = 'fa-solid fa-check';
      copyBtnIcon.style.color = '#22c55e';
      showToast('이메일 주소가 클립보드에 복사되었습니다!');

      setTimeout(() => {
        copyBtnIcon.className = 'fa-regular fa-copy';
        copyBtnIcon.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      showToast('이메일 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });

  // --------------------------------------------------------------------------
  // 7. vCard (.vcf) 연락처 저장 파일 다운로드
  // --------------------------------------------------------------------------
  vcardBtn.addEventListener('click', () => {
    const vcardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:박;규리;;;',
      'FN:박규리',
      'ORG:글로벌경영학과',
      'TITLE:글로벌경영학도',
      'EMAIL;type=INTERNET;type=WORK;type=pref:gouli3338@naver.com',
      'NOTE:글로벌 비전과 전략적 마인드로 가치를 창출하는 비즈니스 인재',
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '박규리_연락처.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('연락처 파일(vCard)이 다운로드되었습니다.');
  });

  // --------------------------------------------------------------------------
  // 8. 명함 공유하기 (Web Share API & 클립보드 링크 복사)
  // --------------------------------------------------------------------------
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: '박규리 | 웹 명함',
      text: '글로벌경영학과 박규리의 디지털 인터랙티브 웹 명함입니다.',
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyPageUrl();
        }
      }
    } else {
      copyPageUrl();
    }
  });

  const copyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('명함 링크가 클립보드에 복사되었습니다!');
    } catch (err) {
      showToast('명함 링크 복사에 실패했습니다.');
    }
  };

  // --------------------------------------------------------------------------
  // 9. QR 코드 모달 제어
  // --------------------------------------------------------------------------
  const generateQRCode = () => {
    if (!qrcodeContainer) return;
    qrcodeContainer.innerHTML = '';
    
    // 현재 웹페이지 URL 또는 명함 vCard 텍스트
    const targetUrl = window.location.href.startsWith('http') 
      ? window.location.href 
      : 'mailto:gouli3338@naver.com';

    qrCodeInstance = new QRCode(qrcodeContainer, {
      text: targetUrl,
      width: 170,
      height: 170,
      colorDark: '#1e293b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  };

  const openModal = () => {
    if (!qrCodeInstance) {
      generateQRCode();
    }
    qrModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    qrModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  qrBtn.addEventListener('click', openModal);
  closeQrModal.addEventListener('click', closeModal);

  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && qrModal.classList.contains('active')) {
      closeModal();
    }
  });
});

