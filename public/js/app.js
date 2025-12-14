// Main App Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('New Graphic App Initialized');

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#notifications') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                
                // Close mobile menu if open
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
                if (menuToggle) {
                    menuToggle.classList.remove('active');
                }
            }
        });
    });

    // Bottom Navigation Active State
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function() {
            bottomNavItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // PWA Install Prompt
    let deferredPrompt;
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    const dismissInstallBtn = document.getElementById('dismissInstallBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show install prompt after 3 seconds
        setTimeout(() => {
            if (installPrompt) {
                installPrompt.style.display = 'block';
            }
        }, 3000);
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            
            // Clear the deferredPrompt
            deferredPrompt = null;
            
            // Hide the install prompt
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
        });
    }

    if (dismissInstallBtn) {
        dismissInstallBtn.addEventListener('click', () => {
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
        });
    }

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        if (installPrompt) {
            installPrompt.style.display = 'none';
        }
        utils.showToast('تم تثبيت التطبيق بنجاح', 'success');
    });

    // Detect if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches 
               || window.navigator.standalone 
               || document.referrer.includes('android-app://');

    if (isPWA) {
        console.log('Running as PWA');
        document.body.classList.add('pwa-mode');
    }

    // Online/Offline Detection
    window.addEventListener('online', () => {
        utils.showToast('تم الاتصال بالإنترنت', 'success');
    });

    window.addEventListener('offline', () => {
        utils.showToast('لا يوجد اتصال بالإنترنت', 'warning');
    });

    // Handle mobile responsive
    const handleResize = () => {
        const bottomNav = document.getElementById('bottomNav');
        if (window.innerWidth <= 768) {
            if (bottomNav && authManager.isAuthenticated()) {
                bottomNav.style.display = 'flex';
            }
        } else {
            if (bottomNav) {
                bottomNav.style.display = 'none';
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Handle notifications link in bottom nav
    const notificationsLink = document.querySelector('.bottom-nav-item[href="#notifications"]');
    if (notificationsLink) {
        notificationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showNotificationsPanel();
        });
    }
});

// Show Notifications Panel
function showNotificationsPanel() {
    // Create notifications modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'notificationsModal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = '<h2>الإشعارات</h2>';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => modal.remove());
    modalHeader.appendChild(closeBtn);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'notifications-actions';
    actionsDiv.style.marginBottom = '1rem';
    
    const markAllBtn = document.createElement('button');
    markAllBtn.className = 'btn btn-small btn-text';
    markAllBtn.textContent = 'تحديد الكل كمقروء';
    markAllBtn.addEventListener('click', async () => {
        await notificationsManager.markAllAsRead();
        notificationsManager.displayNotifications('notificationsList');
    });
    actionsDiv.appendChild(markAllBtn);
    
    const notifList = document.createElement('div');
    notifList.id = 'notificationsList';
    
    modalBody.appendChild(actionsDiv);
    modalBody.appendChild(notifList);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Display notifications
    notificationsManager.displayNotifications('notificationsList');

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Add mobile menu styles
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 60px;
            right: -100%;
            width: 250px;
            height: calc(100vh - 60px);
            background: white;
            flex-direction: column;
            padding: 2rem 0;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            transition: right 0.3s ease;
            z-index: 999;
        }

        .nav-menu.active {
            right: 0;
        }

        .nav-menu .nav-link {
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border-color);
        }

        .menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }

        .menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }

        .menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
        }
    }

    .pwa-mode .header {
        padding-top: env(safe-area-inset-top);
    }

    .pwa-mode .bottom-nav {
        padding-bottom: env(safe-area-inset-bottom);
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.showNotificationsPanel = showNotificationsPanel;
