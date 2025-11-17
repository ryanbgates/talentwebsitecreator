// Script to add Firebase SDK to all HTML files
// This is a one-time utility script

const fs = require('fs');
const path = require('path');

const firebaseScripts = `    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics-compat.js"></script>
    
    <!-- Firebase Configuration -->
    <script src="../js/firebase-config.js"></script>
    <script src="../js/firebase-auth.js"></script>
    
    <!-- Project Scripts -->`;

// Files to update
const filesToUpdate = [
    'dashboard-mobile.html',
    'pricing-desktop.html',
    'pricing-mobile.html',
    'samples-desktop.html',
    'samples-mobile.html',
    'affiliate-desktop.html',
    'affiliate-mobile.html'
];

const htmlDir = path.join(__dirname, '..', 'html');

filesToUpdate.forEach(fileName => {
    const filePath = path.join(htmlDir, fileName);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace script sections
        if (content.includes('<!-- Project Scripts -->')) {
            // Already has Firebase scripts
            console.log(`${fileName} already has Firebase scripts`);
        } else {
            // Add Firebase scripts before existing scripts
            content = content.replace(
                /(\s+<script src="\.\.)/g,
                `${firebaseScripts}\n    <script src="../`
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated ${fileName} with Firebase SDK`);
        }
    } else {
        console.log(`❌ File not found: ${fileName}`);
    }
});

console.log('Firebase SDK update complete!');