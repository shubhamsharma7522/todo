window.WHATSAPP_PHONE = window.WHATSAPP_PHONE || '917239967352';
window.GCS_API_KEY = window.GCS_API_KEY || '';
window.GCS_CX = window.GCS_CX || '';

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isMenuOpen = navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
        });

        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            if (!targetSelector || targetSelector === '#') {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    initializeSignupValidation();
    initializeApiForms();
    initializeGoogleSignIn();
    initializeAuthUI();
    setupBookingModalControls();
    setupVehicleModalControls();
    initializeDetailBookingForm();
    initializeCarServices();
    initializeHomeMap();
    initializeScrollReveal();
    initializeDestinationSliders();
});

function initializeSignupValidation() {
    const signupForm = document.querySelector('.signup-form');
    if (!signupForm) {
        return;
    }

    signupForm.addEventListener('submit', (event) => {
        const passwordInput = document.getElementById('signup-password');
        const confirmInput = document.getElementById('confirm-password');
        if (!passwordInput || !confirmInput) {
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            event.preventDefault();
            setFormStatus(signupForm, 'Passwords do not match. Please check and try again.', 'error');
            confirmInput.focus();
            return;
        }

        setFormStatus(signupForm, '', '');
    });
}

function initializeGoogleSignIn() {
    const googleSlots = document.querySelectorAll('[data-google-signin]');
    if (!googleSlots.length) {
        return;
    }

    googleSlots.forEach((googleSlot) => {
        const clientId = googleSlot.getAttribute('data-google-client-id');
        const mode = (googleSlot.getAttribute('data-google-mode') || 'signup').toLowerCase();
        const modeText = mode === 'signin' ? 'sign-in' : 'sign-up';
        const sourceFile = mode === 'signin' ? 'signin.html' : 'signup.html';

        if (!clientId || clientId.indexOf('YOUR_GOOGLE_CLIENT_ID') !== -1) {
            googleSlot.innerHTML = `<p class="google-message">Add your Google OAuth Client ID in ${sourceFile} to enable Google ${modeText}.</p>`;
            return;
        }

        waitForGoogleLibrary(googleSlot, clientId, mode, 0);
    });
}

function waitForGoogleLibrary(googleSlot, clientId, mode, attempt) {
    if (window.google && google.accounts && google.accounts.id) {
        if (window.__travelBaadshaGoogleClientId !== clientId) {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse
            });
            window.__travelBaadshaGoogleClientId = clientId;
        }

        google.accounts.id.renderButton(googleSlot, {
            theme: 'outline',
            size: 'large',
            text: mode === 'signin' ? 'signin_with' : 'signup_with',
            shape: 'pill',
            width: 320
        });
        return;
    }

    if (attempt >= 10) {
        googleSlot.innerHTML = '<p class="google-message">Google script did not load. Refresh and try again.</p>';
        return;
    }

    window.setTimeout(() => {
        waitForGoogleLibrary(googleSlot, clientId, mode, attempt + 1);
    }, 300);
}

function handleGoogleCredentialResponse(response) {
    const profile = parseJwt(response.credential);
    const name = profile && profile.name ? profile.name : 'traveler';
    alert('Google sign-in successful for ' + name + '. Connect this callback to your backend to create the account.');
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return null;
        }

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

function initializeApiForms() {
    const apiBase = window.TRAVEL_BADSHA_API_BASE || '';
    const forms = document.querySelectorAll('form[data-api-endpoint]');
    if (!forms.length) {
        return;
    }

    forms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            if (event.defaultPrevented) {
                return;
            }

            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const endpoint = form.getAttribute('data-api-endpoint');
            const method = (form.getAttribute('data-api-method') || 'POST').toUpperCase();
            if (!endpoint) {
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const payload = Object.fromEntries(new FormData(form).entries());
            const url = apiBase + endpoint;

            if (submitButton) {
                submitButton.disabled = true;
            }
            setFormStatus(form, 'Submitting...', '');

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                let data = null;
                try {
                    data = await response.json();
                } catch (parseError) {
                    data = null;
                }

                if (!response.ok) {
                    const errorMessage = data && data.message ? data.message : 'Request failed. Please try again.';
                    throw new Error(errorMessage);
                }

                const successMessage = data && data.message ? data.message : 'Request submitted successfully.';
                setFormStatus(form, successMessage, 'success');
                form.reset();
            } catch (error) {
                setFormStatus(form, error.message || 'Could not connect to backend endpoint.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    });
}

function setFormStatus(form, message, type) {
    const status = form.querySelector('.form-status');
    if (!status) {
        return;
    }

    status.textContent = message || '';
    status.classList.remove('is-error', 'is-success');
    if (type === 'error') {
        status.classList.add('is-error');
    }
    if (type === 'success') {
        status.classList.add('is-success');
    }
}

function initializeHomeMap() {
    const mapCanvas = document.getElementById('travel-badsha-map');
    if (!mapCanvas) {
        return;
    }

    const lat = Number.parseFloat(mapCanvas.getAttribute('data-lat') || '19.0760');
    const lng = Number.parseFloat(mapCanvas.getAttribute('data-lng') || '72.8777');
    const zoom = Number.parseInt(mapCanvas.getAttribute('data-zoom') || '13', 10);
    const title = mapCanvas.getAttribute('data-title') || 'Travel Baadsha Office';
    const apiKey = mapCanvas.getAttribute('data-google-maps-key') || '';

    if (!apiKey || apiKey.indexOf('YOUR_GOOGLE_MAPS_API_KEY') !== -1) {
        renderMapFallback(mapCanvas, lat, lng);
        return;
    }

    loadGoogleMapsApi(apiKey)
        .then(() => {
            if (!window.google || !google.maps) {
                throw new Error('Google Maps API did not initialize.');
            }

            const center = { lat, lng };
            const map = new google.maps.Map(mapCanvas, {
                center,
                zoom,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            new google.maps.Marker({
                position: center,
                map,
                title
            });
        })
        .catch(() => {
            renderMapFallback(mapCanvas, lat, lng);
        });
}

function loadGoogleMapsApi(apiKey) {
    if (window.google && google.maps) {
        return Promise.resolve();
    }

    if (window.__travelBadshaMapsPromise) {
        return window.__travelBadshaMapsPromise;
    }

    window.__travelBadshaMapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && google.maps) {
                resolve();
                return;
            }
            reject(new Error('Google Maps API unavailable.'));
        };
        script.onerror = () => reject(new Error('Could not load Google Maps API.'));
        document.head.appendChild(script);
    });

    return window.__travelBadshaMapsPromise;
}

function renderMapFallback(mapCanvas, lat, lng) {
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=14&output=embed`;
    mapCanvas.innerHTML = `
        <div class="map-fallback">
            <iframe src="${mapUrl}" title="Travel Baadsha location fallback map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    `;
}

function initializeScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const revealTargets = new Set();
    const observerSupported = 'IntersectionObserver' in window;
    const revealObserver = observerSupported
        ? new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.16,
                rootMargin: '0px 0px -8% 0px'
            }
        )
        : null;

    const registerReveal = (element, options = {}) => {
        const delay = options.delay || 0;
        const distance = options.distance || 24;
        const scale = options.scale || 1;

        if (!element || revealTargets.has(element)) {
            return;
        }

        revealTargets.add(element);
        element.classList.add('reveal');
        element.style.setProperty('--reveal-delay', `${delay}ms`);
        element.style.setProperty('--reveal-distance', `${distance}px`);
        element.style.setProperty('--reveal-scale', String(scale));

        if (revealObserver) {
            revealObserver.observe(element);
        } else {
            element.classList.add('is-visible');
        }
    };

    document.querySelectorAll('[data-reveal]').forEach((element) => {
        registerReveal(element, {
            delay: 0,
            distance: 18,
            scale: 0.992
        });
    });

    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
        group.querySelectorAll(':scope > *').forEach((item, index) => {
            registerReveal(item, {
                delay: Math.min(index * 85, 400),
                distance: 14,
                scale: 0.99
            });
        });
    });

    document.querySelectorAll('main section:not(.hero) > .container').forEach((container) => {
        if (container.closest('.story-page')) {
            return;
        }

        registerReveal(container, {
            delay: 0,
            distance: 20,
            scale: 0.994
        });
    });

    const staggerSelectors = [
        '.service-cards > *',
        '.vehicle-cards > *',
        '.vehicle-gallery > *',
        '.video-gallery > *',
        '.location-grid > *',
        '.location-points li',
        '.about-features > *',
        '.contact-info > *',
        '.reasons > *',
        '.auth-points li'
    ];

    staggerSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((item, index) => {
            registerReveal(item, {
                delay: Math.min(index * 90, 360),
                distance: 15,
                scale: 0.988
            });
        });
    });

    document.querySelectorAll('.contact-form, .auth-panel, .auth-card, .cta .container, footer .container, .media-note').forEach((element) => {
        registerReveal(element, {
            delay: 60,
            distance: 12,
            scale: 0.995
        });
    });
}

function initializeDestinationSliders() {
    const sliders = document.querySelectorAll('[data-destination-slider]');
    if (!sliders.length) {
        return;
    }

    sliders.forEach((slider) => {
        const track = slider.querySelector('[data-slider-track]');
        const slides = track ? Array.from(track.querySelectorAll('.destination-slide')) : [];
        const prevButton = slider.querySelector('[data-slider-prev]');
        const nextButton = slider.querySelector('[data-slider-next]');
        const dotsContainer = slider.querySelector('[data-slider-dots]');

        if (!track || !slides.length) {
            return;
        }

        let currentIndex = 0;
        let autoTimer = null;
        let touchStartX = 0;
        let touchEndX = 0;

        const setActive = (nextIndex) => {
            currentIndex = (nextIndex + slides.length) % slides.length;
            track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;

            slides.forEach((slide, index) => {
                slide.classList.toggle('is-active', index === currentIndex);
            });

            if (dotsContainer) {
                dotsContainer.querySelectorAll('button').forEach((dot, index) => {
                    dot.classList.toggle('is-active', index === currentIndex);
                    dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
                });
            }
        };

        const stopAuto = () => {
            if (autoTimer) {
                window.clearInterval(autoTimer);
                autoTimer = null;
            }
        };

        const startAuto = () => {
            stopAuto();
            autoTimer = window.setInterval(() => {
                setActive(currentIndex + 1);
            }, 5000);
        };

        if (dotsContainer) {
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'destination-dot';
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.addEventListener('click', () => {
                    setActive(index);
                    startAuto();
                });
                dotsContainer.appendChild(dot);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                setActive(currentIndex - 1);
                startAuto();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                setActive(currentIndex + 1);
                startAuto();
            });
        }

        slider.addEventListener('mouseenter', stopAuto);
        slider.addEventListener('mouseleave', startAuto);
        slider.addEventListener('focusin', stopAuto);
        slider.addEventListener('focusout', (event) => {
            const nextFocused = event.relatedTarget;
            if (!nextFocused || !slider.contains(nextFocused)) {
                startAuto();
            }
        });

        slider.addEventListener('touchstart', (event) => {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        slider.addEventListener('touchend', (event) => {
            touchEndX = event.changedTouches[0].clientX;
            const distance = touchStartX - touchEndX;
            if (Math.abs(distance) < 45) {
                return;
            }

            if (distance > 0) {
                setActive(currentIndex + 1);
            } else {
                setActive(currentIndex - 1);
            }
            startAuto();
        }, { passive: true });

        const destinationSelect = document.getElementById('destination-name');
        const destinationForm = document.getElementById('destination-enquiry-form');
        slider.querySelectorAll('[data-slide-book]').forEach((button) => {
            button.addEventListener('click', () => {
                const destinationValue = button.getAttribute('data-slide-book');
                if (!destinationValue || !destinationSelect) {
                    return;
                }

                destinationSelect.value = destinationValue;
                destinationSelect.dispatchEvent(new Event('change', { bubbles: true }));
                if (destinationForm) {
                    destinationForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        setActive(0);
        startAuto();
    });
}

let currentUser = null;

async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        if (!response.ok) {
            currentUser = null;
            return null;
        }
        const data = await response.json();
        currentUser = data.user;
        return currentUser;
    } catch (_error) {
        currentUser = null;
        return null;
    }
}

function updateNavAuthState() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) {
        return;
    }

    const signIn = navLinks.querySelector('a[href="signin.html"]');
    const signUp = navLinks.querySelector('a[href="signup.html"]');
    const existingLogout = navLinks.querySelector('[data-logout]');

    if (currentUser) {
        if (signIn) {
            signIn.parentElement.style.display = 'none';
        }
        if (signUp) {
            signUp.parentElement.style.display = 'none';
        }
        if (!existingLogout) {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-cta';
            btn.textContent = 'Logout';
            btn.setAttribute('data-logout', 'true');
            btn.addEventListener('click', async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                currentUser = null;
                updateNavAuthState();
                window.location.href = '/';
            });
            li.appendChild(btn);
            navLinks.appendChild(li);
        }
    } else {
        if (signIn) {
            signIn.parentElement.style.display = '';
        }
        if (signUp) {
            signUp.parentElement.style.display = '';
        }
        if (existingLogout) {
            existingLogout.parentElement.remove();
        }
    }
}

async function initializeAuthUI() {
    await fetchCurrentUser();
    updateNavAuthState();
}

function buildVehicleCard(vehicle) {
    const card = document.createElement('article');
    card.className = 'card vehicle-card';
    const pricePerDay = vehicle.pricePerDay ? `Rs. ${Number(vehicle.pricePerDay).toLocaleString('en-IN')}/day` : '';

    card.innerHTML = `
        <img src="${vehicle.image || './media/images/vehicle-01.jpg'}" alt="${vehicle.name}" loading="lazy" onerror="this.onerror=null;this.src='./media/images/vehicle-01.jpg';">
        <h3>${vehicle.name}</h3>
        <p class="vehicle-meta">${vehicle.brand || ''}</p>
        <p class="price-tag">${pricePerDay}</p>
        <p class="vehicle-meta"><strong>${vehicle.seats || '?'} seats</strong> Â· ${vehicle.transmission || ''} Â· ${vehicle.fuelType || ''}</p>
        <button class="btn-primary btn-book" type="button" data-vehicle-id="${vehicle._id}">Book Now</button>
    `;

    return card;
}

function showBookingPanel(vehicle) {
    const panel = document.getElementById('booking-panel');
    const title = document.getElementById('booking-title');
    const form = document.getElementById('booking-form');
    if (!panel || !form) {
        return;
    }

    panel.hidden = false;
    if (title) {
        title.textContent = `Book ${vehicle.name}`;
    }
    form.setAttribute('data-vehicle-id', vehicle._id);
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function attachBookingFormHandler() {
    const form = document.getElementById('booking-form');
    const status = document.querySelector('#booking-form .form-status');
    if (!form) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentUser) {
            window.location.href = '/api/auth/google';
            return;
        }

        const vehicleId = form.getAttribute('data-vehicle-id');
        const startDate = form.startDate.value;
        const endDate = form.endDate.value;

        if (!vehicleId || !startDate || !endDate) {
            if (status) {
                status.textContent = 'Select a vehicle and choose dates.';
                status.classList.add('is-error');
            }
            return;
        }

        if (status) {
            status.textContent = 'Booking...';
            status.classList.remove('is-error', 'is-success');
        }

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ vehicleId, startDate, endDate })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                const message = data && data.message ? data.message : 'Booking failed.';
                throw new Error(message);
            }

            const data = await response.json();
            if (status) {
                status.textContent = `Booking submitted. Status: ${data.booking.status}`;
                status.classList.remove('is-error');
                status.classList.add('is-success');
            }
            form.reset();
        } catch (error) {
            if (status) {
                status.textContent = error.message || 'Booking failed';
                status.classList.add('is-error');
            }
        }
    });
}

function createCarCard(car) {
    const card = document.createElement('article');
    card.className = 'car-card vehicle-card';
    card.setAttribute('data-category', car.category);

    const whatsappNumber = (car.whatsappNumber || window.WHATSAPP_PHONE || '').replace(/[^0-9]/g, '');
    const waLink = whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I want to book the ${car.name} (${car.category}) on Travel Baadsha.`)}`
        : null;

    card.innerHTML = `
        <div class="card-media">
            <span class="badge badge-category">${formatCategoryName(car.category)}</span>
            <img src="${car.image || './media/images/vehicle-01.jpg'}" alt="${car.name}" loading="lazy"
                onerror="this.onerror=null;this.src='./media/images/vehicle-01.jpg';">
        </div>
        <div class="card-body">
            <div class="card-top">
                <h3>${car.name}</h3>
                <span class="price-pill">${formatRupees(car.pricePerDay)}/day</span>
            </div>
            <p class="vehicle-desc">${car.description || ''}</p>
            <div class="car-meta">
                <span>${car.seats || 4} seats</span>
                <span>${car.fuelType || ''}</span>
                <span>${car.transmission || ''}</span>
            </div>
            <div class="car-actions">
                <button class="btn-secondary btn-details" type="button" data-car-id="${car.id}">View Details</button>
                <button class="btn-primary btn-book" type="button" data-car-id="${car.id}">Book Now</button>
                ${waLink ? `<a class="btn-whatsapp-icon" href="${waLink}" target="_blank" rel="noreferrer noopener" aria-label="WhatsApp ${car.name} booking">WA</a>` : ''}
            </div>
        </div>
    `;
    return card;
}

function showBookingModal(car) {
    const modal = document.getElementById('booking-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    document.getElementById('booking-name').textContent = car.name;
    document.getElementById('booking-category').textContent = formatCategoryName(car.category);
    document.getElementById('booking-price').textContent = `${formatRupees(car.pricePerDay)}/day`;
    document.getElementById('booking-car-id').value = car.id;

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.dataset.pricePerDay = car.pricePerDay || '';
        bookingForm.dataset.vehicleName = car.name || '';
    }

    const status = modal.querySelector('.form-status');
    if (status) {
        status.textContent = '';
        status.classList.remove('is-error', 'is-success');
    }
}

function hideBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    document.body.style.overflow = '';
}

const manualGalleryOverrides = window.VEHICLE_GALLERIES || {};

const defaultTagsByCategory = {
    sports: ['Turbocharged', 'Launch Control', 'Premium Sound'],
    'luxury-sedan': ['Ambient Lighting', 'Executive Seats', 'Panoramic Roof'],
    'budget-sedan': ['Fuel Efficient', 'Easy Parking', 'Bluetooth Audio'],
    suv: ['All Rows AC', 'Captain Seats', 'Hill Assist'],
    bus: ['Pushback Seats', 'USB Charging', 'Onboard Wi-Fi']
};

const detailState = {
    car: null,
    images: [],
    index: 0
};

function formatCategoryName(category) {
    const labels = {
        sports: 'Sports Cars',
        'luxury-sedan': 'Luxury Sedans',
        'budget-sedan': 'Budget Sedans',
        suv: 'SUVs',
        bus: 'Bus Services'
    };
    return labels[category] || (category || '').replace('-', ' ');
}

function formatRupees(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function getFeatureTags(car) {
    if (car.tags && Array.isArray(car.tags)) {
        return car.tags;
    }
    return defaultTagsByCategory[car.category] || [];
}

async function fetchRelatedImages(query, limit = 4) {
    if (!window.GCS_API_KEY || !window.GCS_CX) {
        return [];
    }
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('searchType', 'image');
    searchUrl.searchParams.set('num', String(limit));
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', window.GCS_API_KEY);
    searchUrl.searchParams.set('cx', window.GCS_CX);

    try {
        const res = await fetch(searchUrl.toString());
        if (!res.ok) {
            throw new Error('Image search failed');
        }
        const data = await res.json();
        const items = data.items || [];
        return items.map((item) => item.link).filter(Boolean);
    } catch (_error) {
        return [];
    }
}

async function buildGalleryImages(car) {
    const manual = manualGalleryOverrides[car.id] || [];
    const base = car.image ? [car.image] : [];
    const provided = Array.isArray(car.gallery) ? car.gallery : [];
    const fetched = await fetchRelatedImages(`${car.name} ${car.category}`, 4);
    const unique = [];
    const seen = new Set();

    [...manual, ...provided, ...base, ...fetched].forEach((src) => {
        if (src && !seen.has(src)) {
            seen.add(src);
            unique.push(src);
        }
    });

    if (!unique.length) {
        unique.push('./media/images/vehicle-01.jpg');
    }

    return unique.slice(0, 6);
}

function renderVehicleGallery(images) {
    const mainImage = document.getElementById('vehicle-main-image');
    const thumbs = document.getElementById('vehicle-thumbs');
    if (!mainImage || !thumbs) {
        return;
    }

    thumbs.innerHTML = '';
    detailState.images = images;
    detailState.index = 0;
    mainImage.src = images[0];

    images.forEach((src, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'thumb';
        button.setAttribute('aria-label', `Show image ${index + 1}`);
        button.innerHTML = `<img src="${src}" alt="Vehicle image ${index + 1}" loading="lazy">`;
        if (index === 0) {
            button.classList.add('is-active');
        }
        button.addEventListener('click', () => setActiveGalleryIndex(index));
        thumbs.appendChild(button);
    });
}

function setActiveGalleryIndex(nextIndex) {
    const mainImage = document.getElementById('vehicle-main-image');
    const thumbs = document.querySelectorAll('#vehicle-thumbs .thumb');
    if (!mainImage || !thumbs.length) {
        return;
    }
    detailState.index = (nextIndex + detailState.images.length) % detailState.images.length;
    mainImage.classList.add('is-fading');
    mainImage.onload = () => mainImage.classList.remove('is-fading');
    mainImage.src = detailState.images[detailState.index];

    thumbs.forEach((thumb, idx) => {
        thumb.classList.toggle('is-active', idx === detailState.index);
    });
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    document.body.style.overflow = '';
}

function setupVehicleModalControls() {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVehicleModal);
    }
    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.close-modal')) {
            closeVehicleModal();
        }
    });
    modal.querySelector('[data-gallery-prev]')?.addEventListener('click', () => {
        setActiveGalleryIndex(detailState.index - 1);
    });
    modal.querySelector('[data-gallery-next]')?.addEventListener('click', () => {
        setActiveGalleryIndex(detailState.index + 1);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) {
            closeVehicleModal();
        }
        if (event.key === 'ArrowLeft' && !modal.hidden) {
            setActiveGalleryIndex(detailState.index - 1);
        }
        if (event.key === 'ArrowRight' && !modal.hidden) {
            setActiveGalleryIndex(detailState.index + 1);
        }
    });
}

async function openVehicleDetails(car) {
    const modal = document.getElementById('vehicle-modal');
    if (!modal) return;

    detailState.car = car;
    const images = await buildGalleryImages(car);
    renderVehicleGallery(images);

    modal.querySelector('#vehicle-category').textContent = formatCategoryName(car.category);
    modal.querySelector('#vehicle-title').textContent = car.name;
    modal.querySelector('#vehicle-description').textContent = car.description || '';
    modal.querySelector('#vehicle-price').textContent = `${formatRupees(car.pricePerDay)}/day`;
    modal.querySelector('#vehicle-seats').textContent = `${car.seats || '?'} seats`;
    modal.querySelector('#vehicle-fuel').textContent = car.fuelType || 'â€”';
    modal.querySelector('#vehicle-transmission').textContent = car.transmission || 'â€”';
    modal.querySelector('#vehicle-color').textContent = car.color || 'â€”';

    const tagWrap = modal.querySelector('#vehicle-tags');
    tagWrap.innerHTML = '';
    getFeatureTags(car).forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'chip';
        span.textContent = tag;
        tagWrap.appendChild(span);
    });

    const form = document.getElementById('detail-booking-form');
    if (form) {
        form.reset();
        form.querySelector('#detail-vehicle-id').value = car.id;
        form.querySelector('#detail-vehicle-name').value = car.name;
        form.querySelector('#detail-price-per-day').value = car.pricePerDay || '';
        form.querySelector('#detail-booking-source').value = 'form';
        const status = form.querySelector('.form-status');
        if (status) {
            status.textContent = '';
            status.classList.remove('is-error', 'is-success');
        }
    }

    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function validateDetailDates(form) {
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;
    if (!startDate || !endDate) {
        return { valid: false, message: 'Select both start and end dates.' };
    }
    if (new Date(endDate) < new Date(startDate)) {
        return { valid: false, message: 'End date cannot be before start date.' };
    }
    return { valid: true, startDate, endDate };
}

function buildWhatsAppUrl(car, form) {
    const name = form.customerName.value.trim();
    const email = form.customerEmail.value.trim();
    const phone = form.customerPhone.value.trim();
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;
    const notes = form.notes.value.trim();

    const message = [
        `Vehicle: ${car.name}`,
        `Category: ${formatCategoryName(car.category)}`,
        `Price: ${formatRupees(car.pricePerDay)}/day`,
        startDate && endDate ? `Dates: ${startDate} to ${endDate}` : 'Dates: (not selected)',
        name ? `Name: ${name}` : '',
        email ? `Email: ${email}` : '',
        phone ? `Phone: ${phone}` : '',
        notes ? `Notes: ${notes}` : ''
    ]
        .filter(Boolean)
        .join('\n');

    const number = (window.WHATSAPP_PHONE || '91XXXXXXXXXX').replace(/[^0-9]/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function handleWhatsAppBooking(event) {
    event.preventDefault();
    if (!detailState.car) return;
    const form = document.getElementById('detail-booking-form');
    const status = form?.querySelector('.form-status');
    const dateCheck = validateDetailDates(form);
    if (!dateCheck.valid) {
        if (status) {
            status.textContent = dateCheck.message;
            status.classList.add('is-error');
        }
        return;
    }
    if (status) {
        status.textContent = 'Opening WhatsApp...';
        status.classList.remove('is-error');
    }
    window.open(buildWhatsAppUrl(detailState.car, form), '_blank');
}

async function submitDetailBooking(event) {
    event.preventDefault();
    if (!detailState.car) return;
    const form = event.currentTarget;
    const status = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const spinner = form.querySelector('.btn-spinner');
    const dateCheck = validateDetailDates(form);

    if (!dateCheck.valid) {
        if (status) {
            status.textContent = dateCheck.message;
            status.classList.add('is-error');
        }
        return;
    }

    const payload = {
        vehicleId: detailState.car.id,
        vehicleName: detailState.car.name,
        pricePerDay: detailState.car.pricePerDay,
        userName: form.customerName.value.trim(),
        email: form.customerEmail.value.trim(),
        phone: form.customerPhone.value.trim(),
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        notes: form.notes.value.trim(),
        bookingSource: 'form'
    };

    if (!payload.userName || !payload.email || !payload.phone) {
        if (status) {
            status.textContent = 'Name, email, and phone are required.';
            status.classList.add('is-error');
        }
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.classList.remove('is-hidden');
    if (status) {
        status.textContent = 'Submitting...';
        status.classList.remove('is-error', 'is-success');
    }

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const message = data && data.message ? data.message : 'Booking failed. Please try again.';
            throw new Error(message);
        }
        if (status) {
            status.textContent = data.message || 'Booking received. We will confirm shortly.';
            status.classList.add('is-success');
        }
        form.reset();
    } catch (error) {
        if (status) {
            status.textContent = error.message || 'Booking failed.';
            status.classList.add('is-error');
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add('is-hidden');
    }
}

function initializeDetailBookingForm() {
    const form = document.getElementById('detail-booking-form');
    const whatsappBtn = document.getElementById('whatsapp-book-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', handleWhatsAppBooking);
    }
    if (form) {
        form.addEventListener('submit', submitDetailBooking);
    }
}

function setupBookingModalControls() {
    const modal = document.getElementById('booking-modal');
    if (!modal) {
        return;
    }

    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideBookingModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal || event.target.closest('.close-modal')) {
            hideBookingModal();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) {
            hideBookingModal();
        }
    });
}

async function initializeCarServices() {
    const grid = document.querySelector('[data-car-grid]');
    if (!grid) return;

    const filters = document.querySelectorAll('.filter-btn');
    const form = document.getElementById('booking-form');
    let cars = Array.isArray(window.VEHICLES) ? window.VEHICLES : [];

    const categoryLabels = {
        sports: 'Sports Cars',
        'luxury-sedan': 'Luxury Sedans',
        'budget-sedan': 'Budget Sedans',
        suv: 'SUVs',
        bus: 'Bus Services'
    };
    const categoryOrder = ['sports', 'luxury-sedan', 'budget-sedan', 'suv', 'bus'];

    const renderCars = (category) => {
        grid.innerHTML = '';
        const activeCats = category === 'all' ? categoryOrder : [category];
        let rendered = 0;

        activeCats.forEach((cat) => {
            const catCars = cars.filter((c) => c.category === cat);
            if (!catCars.length) return;

            const section = document.createElement('div');
            section.className = 'category-block';
            section.dataset.category = cat;
            section.setAttribute('data-reveal', '');

            section.innerHTML = `
                <div class="category-heading">
                    <h3>${categoryLabels[cat] || cat}</h3>
                    <p class="section-copy">Handpicked ${categoryLabels[cat] || cat} with professional chauffeurs.</p>
                </div>
                <div class="modern-grid vehicle-grid"></div>
            `;

            const wrap = section.querySelector('.vehicle-grid');
            catCars.forEach((car) => {
                const card = createCarCard(car);
                wrap.appendChild(card);
                const bookBtn = card.querySelector('.btn-book');
                const detailBtn = card.querySelector('.btn-details');
                if (bookBtn) bookBtn.addEventListener('click', () => showBookingModal(car));
                if (detailBtn) detailBtn.addEventListener('click', () => openVehicleDetails(car));
            });

            grid.appendChild(section);
            rendered += catCars.length;
        });

        if (!rendered) {
            grid.innerHTML = '<p class="form-status is-error">No vehicles in this category.</p>';
        }
    };

    filters.forEach((btn) => {
        btn.addEventListener('click', () => {
            filters.forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            filters.forEach((b) => b.setAttribute('aria-selected', 'false'));
            btn.setAttribute('aria-selected', 'true');
            renderCars(btn.getAttribute('data-filter'));
        });
    });

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const status = form.querySelector('.form-status');
            const submitBtn = form.querySelector('button[type="submit"]');
            const startDate = form.startDate.value;
            const endDate = form.endDate.value;

            if (!startDate || !endDate) {
                if (status) {
                    status.textContent = 'Select start and end dates.';
                    status.classList.add('is-error');
                }
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                if (status) {
                    status.textContent = 'End date cannot be before start date.';
                    status.classList.add('is-error');
                }
                return;
            }

            const payload = {
                vehicleId: form.querySelector('#booking-car-id').value,
                vehicleName: form.dataset.vehicleName || '',
                pricePerDay: Number(form.dataset.pricePerDay || 0),
                userName: form.customerName.value.trim(),
                email: form.customerEmail.value.trim(),
                phone: form.customerPhone.value.trim(),
                startDate,
                endDate,
                notes: form.notes.value.trim(),
                bookingSource: 'form'
            };

            if (!payload.userName || !payload.email || !payload.phone) {
                if (status) {
                    status.textContent = 'Name, email, and phone are required.';
                    status.classList.add('is-error');
                }
                return;
            }

            if (status) {
                status.textContent = 'Submitting...';
                status.classList.remove('is-error', 'is-success');
            }
            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error((data && data.message) || 'Booking failed.');
                }
                if (status) {
                    status.textContent = 'Booking submitted. We will confirm shortly.';
                    status.classList.add('is-success');
                }
                form.reset();
                window.setTimeout(hideBookingModal, 800);
            } catch (error) {
                if (status) {
                    status.textContent = error.message;
                    status.classList.add('is-error');
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    if (!cars.length) {
        try {
            const res = await fetch('/api/cars');
            if (!res.ok) throw new Error('Could not load cars');
            const data = await res.json();
            cars = data.cars || [];
        } catch (error) {
            grid.innerHTML = `<p class="form-status is-error">${error.message}</p>`;
            return;
        }
    }

    renderCars('all');
}

window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;




