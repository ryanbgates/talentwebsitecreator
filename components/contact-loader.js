// Contact Modal Loader
(function() {
    console.log('🔧 Contact modal loader starting...');
    
    // Load contact modal CSS
    const contactCSS = document.createElement('link');
    contactCSS.rel = 'stylesheet';
    contactCSS.href = '../components/contact-modal.css';
    document.head.appendChild(contactCSS);

    // Load contact modal HTML
    console.log('📦 Loading contact modal HTML...');
    
    fetch('../components/contact-modal.html')
        .then(response => response.text())
        .then(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv.firstElementChild);
            
            console.log('✅ Contact modal HTML loaded');

            // Load contact modal JS after HTML is loaded
            const contactScript = document.createElement('script');
            contactScript.src = '../components/contact-modal.js';
            
            console.log('📦 Loading contact modal JS...');
            
            document.body.appendChild(contactScript);
        })
        .catch(error => {
            console.error('❌ Error loading contact modal HTML:', error);
        });
})();
