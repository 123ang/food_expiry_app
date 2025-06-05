const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateTabletScreenshots() {
    console.log('🚀 Starting tablet screenshot generation...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const screens = [
        // 7-inch tablet screenshots (1024x600)
        {
            name: '7inch-home',
            file: '7inch-home.html',
            viewport: { width: 1024, height: 600 },
            output: '7inch-tablet-home.png'
        },
        {
            name: '7inch-list',
            file: '7inch-list.html',
            viewport: { width: 1024, height: 600 },
            output: '7inch-tablet-list.png'
        },
        
        // 10-inch tablet screenshots (1280x800)
        {
            name: '10inch-home',
            file: '10inch-home.html',
            viewport: { width: 1280, height: 800 },
            output: '10inch-tablet-home.png'
        }
    ];

    // Create additional screens for other views
    const additionalScreens = [
        // Add Item screen for 7-inch
        {
            name: '7inch-add-item',
            viewport: { width: 1024, height: 600 },
            output: '7inch-tablet-add-item.png',
            content: createAddItemHTML(1024, 600)
        },
        // Calendar screen for 7-inch
        {
            name: '7inch-calendar',
            viewport: { width: 1024, height: 600 },
            output: '7inch-tablet-calendar.png',
            content: createCalendarHTML(1024, 600)
        },
        // Settings screen for 7-inch
        {
            name: '7inch-settings',
            viewport: { width: 1024, height: 600 },
            output: '7inch-tablet-settings.png',
            content: createSettingsHTML(1024, 600)
        },
        
        // 10-inch versions
        {
            name: '10inch-list',
            viewport: { width: 1280, height: 800 },
            output: '10inch-tablet-list.png',
            content: createListHTML(1280, 800)
        },
        {
            name: '10inch-add-item',
            viewport: { width: 1280, height: 800 },
            output: '10inch-tablet-add-item.png',
            content: createAddItemHTML(1280, 800)
        },
        {
            name: '10inch-calendar',
            viewport: { width: 1280, height: 800 },
            output: '10inch-tablet-calendar.png',
            content: createCalendarHTML(1280, 800)
        },
        {
            name: '10inch-settings',
            viewport: { width: 1280, height: 800 },
            output: '10inch-tablet-settings.png',
            content: createSettingsHTML(1280, 800)
        }
    ];

    try {
        // Process existing HTML files
        for (const screen of screens) {
            console.log(`📸 Generating ${screen.output}...`);
            
            const page = await browser.newPage();
            await page.setViewport(screen.viewport);
            
            const filePath = path.join(__dirname, screen.file);
            await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });
            
            await page.screenshot({
                path: path.join(__dirname, screen.output),
                fullPage: false,
                clip: {
                    x: 0,
                    y: 0,
                    width: screen.viewport.width,
                    height: screen.viewport.height
                }
            });
            
            await page.close();
            console.log(`✅ Generated ${screen.output}`);
        }

        // Process additional screens with generated content
        for (const screen of additionalScreens) {
            console.log(`📸 Generating ${screen.output}...`);
            
            const page = await browser.newPage();
            await page.setViewport(screen.viewport);
            
            await page.setContent(screen.content, { waitUntil: 'networkidle0' });
            
            await page.screenshot({
                path: path.join(__dirname, screen.output),
                fullPage: false,
                clip: {
                    x: 0,
                    y: 0,
                    width: screen.viewport.width,
                    height: screen.viewport.height
                }
            });
            
            await page.close();
            console.log(`✅ Generated ${screen.output}`);
        }

        console.log('🎉 All tablet screenshots generated successfully!');
        console.log('\n📱 Generated screenshots:');
        
        const allScreens = [...screens, ...additionalScreens];
        allScreens.forEach(screen => {
            const outputFile = screen.output || screen.file.replace('.html', '.png');
            console.log(`   - ${outputFile}`);
        });
        
        console.log('\n📋 Ready for Google Play Store upload!');
        
    } catch (error) {
        console.error('❌ Error generating screenshots:', error);
    } finally {
        await browser.close();
    }
}

// Helper functions to generate HTML content
function createAddItemHTML(width, height) {
    const isLarge = width > 1100;
    const padding = isLarge ? '40px' : '30px';
    const fontSize = isLarge ? '42px' : '32px';
    const inputPadding = isLarge ? '20px' : '15px';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
                width: ${width}px;
                height: ${height}px;
                overflow: hidden;
            }
            .tablet-frame {
                width: 100%; height: 100%; background: #000;
                padding: ${padding}; border-radius: 20px;
            }
            .screen {
                width: 100%; height: 100%; background: #fff;
                border-radius: 15px; overflow: hidden; position: relative;
            }
            .header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 20px ${padding}; border-bottom: 1px solid #e0e0e0;
            }
            .back-btn { font-size: 24px; color: #2c3e50; }
            .title { font-size: ${fontSize}; font-weight: bold; color: #2c3e50; }
            .save-btn {
                background: #27ae60; color: white; padding: 12px 24px;
                border-radius: 8px; font-weight: 600; text-decoration: none;
            }
            .form-section { padding: ${padding}; }
            .form-group { margin-bottom: 30px; }
            .label { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #2c3e50; }
            .input {
                width: 100%; padding: ${inputPadding}; border: 1px solid #e0e0e0;
                border-radius: 8px; font-size: 16px; background: #f8f9fa;
            }
            .photo-section {
                border: 2px dashed #e0e0e0; border-radius: 15px;
                padding: 40px; text-align: center; background: #f8f9fa;
            }
            .camera-icon { font-size: 48px; color: #7f8c8d; margin-bottom: 15px; }
            .add-photo-btn {
                background: #27ae60; color: white; padding: 15px 30px;
                border-radius: 8px; font-weight: 600; margin-top: 20px;
                display: inline-block; text-decoration: none;
            }
            .categories { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .category-card {
                background: white; padding: 25px; border-radius: 15px;
                text-align: center; border: 2px solid #e0e0e0; cursor: pointer;
            }
            .category-icon { font-size: 32px; margin-bottom: 10px; }
            .nav { position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
                   background: white; display: flex; justify-content: space-around;
                   align-items: center; border-top: 1px solid #e0e0e0; }
            .nav-item { display: flex; flex-direction: column; align-items: center;
                       color: #7f8c8d; text-decoration: none; }
            .nav-item.active { color: #27ae60; }
            .nav-icon { font-size: 24px; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="tablet-frame">
            <div class="screen">
                <div class="header">
                    <div class="back-btn">←</div>
                    <div class="title">Add Item</div>
                    <a href="#" class="save-btn">Save</a>
                </div>
                <div class="form-section">
                    <div class="form-group">
                        <div class="label">Item Name</div>
                        <input type="text" class="input" placeholder="Enter food item name">
                    </div>
                    <div class="form-group">
                        <div class="label">Quantity</div>
                        <input type="text" class="input" value="1">
                    </div>
                    <div class="form-group">
                        <div class="label">Photo (Optional)</div>
                        <div class="photo-section">
                            <div class="camera-icon">📷</div>
                            <div>Add Photo</div>
                            <a href="#" class="add-photo-btn">+ Add Photo</a>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="label">Category</div>
                        <div class="categories">
                            <div class="category-card">
                                <div class="category-icon">🍞</div>
                                <div>Bread</div>
                            </div>
                            <div class="category-card">
                                <div class="category-icon">🥛</div>
                                <div>Dairy</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nav">
                    <a href="#" class="nav-item"><div class="nav-icon">🏠</div><div>Home</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📋</div><div>List</div></a>
                    <a href="#" class="nav-item active"><div class="nav-icon">➕</div><div></div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📅</div><div>Calendar</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">⚙️</div><div>Settings</div></a>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

function createCalendarHTML(width, height) {
    const isLarge = width > 1100;
    const padding = isLarge ? '40px' : '30px';
    const fontSize = isLarge ? '42px' : '32px';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5; width: ${width}px; height: ${height}px; overflow: hidden;
            }
            .tablet-frame { width: 100%; height: 100%; background: #000; padding: ${padding}; border-radius: 20px; }
            .screen { width: 100%; height: 100%; background: #fff; border-radius: 15px; overflow: hidden; position: relative; }
            .header { text-align: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
            .title { font-size: ${fontSize}; font-weight: bold; color: #2c3e50; }
            .calendar-header { display: flex; justify-content: space-between; align-items: center; padding: 20px ${padding}; }
            .month-nav { font-size: 24px; color: #2c3e50; cursor: pointer; }
            .month-year { font-size: 24px; font-weight: 600; }
            .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; padding: 0 ${padding}; }
            .day-header { text-align: center; padding: 15px 0; font-weight: 600; color: #7f8c8d; }
            .day-cell {
                aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
                font-size: 18px; border-radius: 8px; cursor: pointer;
            }
            .day-cell.today { background: #27ae60; color: white; font-weight: bold; }
            .day-cell.other-month { color: #bdc3c7; }
            .event-section { padding: 20px ${padding}; }
            .event-date { font-size: 20px; font-weight: 600; margin-bottom: 10px; }
            .event-items { color: #7f8c8d; }
            .nav { position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
                   background: white; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #e0e0e0; }
            .nav-item { display: flex; flex-direction: column; align-items: center; color: #7f8c8d; text-decoration: none; }
            .nav-item.active { color: #27ae60; }
            .nav-icon { font-size: 24px; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="tablet-frame">
            <div class="screen">
                <div class="header">
                    <div class="title">Calendar</div>
                </div>
                <div class="calendar-header">
                    <div class="month-nav">←</div>
                    <div class="month-year">June 2025</div>
                    <div class="month-nav">→</div>
                </div>
                <div class="calendar-grid">
                    <div class="day-header">Sun</div><div class="day-header">Mon</div><div class="day-header">Tue</div>
                    <div class="day-header">Wed</div><div class="day-header">Thu</div><div class="day-header">Fri</div><div class="day-header">Sat</div>
                    <div class="day-cell">1</div><div class="day-cell">2</div><div class="day-cell">3</div><div class="day-cell">4</div>
                    <div class="day-cell today">5</div><div class="day-cell">6</div><div class="day-cell">7</div>
                    <div class="day-cell">8</div><div class="day-cell">9</div><div class="day-cell">10</div><div class="day-cell">11</div>
                    <div class="day-cell">12</div><div class="day-cell">13</div><div class="day-cell">14</div>
                    <div class="day-cell">15</div><div class="day-cell">16</div><div class="day-cell">17</div><div class="day-cell">18</div>
                    <div class="day-cell">19</div><div class="day-cell">20</div><div class="day-cell">21</div>
                    <div class="day-cell">22</div><div class="day-cell">23</div><div class="day-cell">24</div><div class="day-cell">25</div>
                    <div class="day-cell">26</div><div class="day-cell">27</div><div class="day-cell">28</div>
                    <div class="day-cell">29</div><div class="day-cell">30</div><div class="day-cell other-month">1</div><div class="day-cell other-month">2</div>
                </div>
                <div class="event-section">
                    <div class="event-date">June 5, 2025</div>
                    <div class="event-items">0 items</div>
                </div>
                <div class="nav">
                    <a href="#" class="nav-item"><div class="nav-icon">🏠</div><div>Home</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📋</div><div>List</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">➕</div><div></div></a>
                    <a href="#" class="nav-item active"><div class="nav-icon">📅</div><div>Calendar</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">⚙️</div><div>Settings</div></a>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

function createSettingsHTML(width, height) {
    const isLarge = width > 1100;
    const padding = isLarge ? '40px' : '30px';
    const fontSize = isLarge ? '42px' : '32px';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5; width: ${width}px; height: ${height}px; overflow: hidden;
            }
            .tablet-frame { width: 100%; height: 100%; background: #000; padding: ${padding}; border-radius: 20px; }
            .screen { width: 100%; height: 100%; background: #fff; border-radius: 15px; overflow: hidden; position: relative; }
            .header { text-align: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
            .title { font-size: ${fontSize}; font-weight: bold; color: #2c3e50; }
            .settings-container { padding: ${padding}; }
            .settings-list { background: white; border-radius: 15px; overflow: hidden; }
            .setting-item {
                display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #f0f0f0;
                cursor: pointer; transition: background 0.3s;
            }
            .setting-item:last-child { border-bottom: none; }
            .setting-item:hover { background: #f8f9fa; }
            .setting-icon {
                width: 40px; height: 40px; border-radius: 8px; display: flex;
                align-items: center; justify-content: center; font-size: 20px; margin-right: 20px;
            }
            .setting-content { flex: 1; }
            .setting-title { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
            .setting-subtitle { color: #7f8c8d; font-size: 14px; }
            .setting-arrow { color: #7f8c8d; font-size: 18px; }
            .nav { position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
                   background: white; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #e0e0e0; }
            .nav-item { display: flex; flex-direction: column; align-items: center; color: #7f8c8d; text-decoration: none; }
            .nav-item.active { color: #27ae60; }
            .nav-icon { font-size: 24px; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="tablet-frame">
            <div class="screen">
                <div class="header">
                    <div class="title">Settings</div>
                </div>
                <div class="settings-container">
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">🌐</div>
                            <div class="setting-content">
                                <div class="setting-title">Language</div>
                                <div class="setting-subtitle">Change app language</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">🎨</div>
                            <div class="setting-content">
                                <div class="setting-title">Theme</div>
                                <div class="setting-subtitle">Choose your preferred theme: Original</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">🏷️</div>
                            <div class="setting-content">
                                <div class="setting-title">Categories</div>
                                <div class="setting-subtitle">Manage food categories</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">📍</div>
                            <div class="setting-content">
                                <div class="setting-title">Storage Locations</div>
                                <div class="setting-subtitle">Manage storage locations</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">🔔</div>
                            <div class="setting-content">
                                <div class="setting-title">Notifications</div>
                                <div class="setting-subtitle">Manage notification settings</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">🔄</div>
                            <div class="setting-content">
                                <div class="setting-title">Reset Database</div>
                                <div class="setting-subtitle">Reset to original 8 categories and 4 locations</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-icon" style="background: #e8f5e8;">ℹ️</div>
                            <div class="setting-content">
                                <div class="setting-title">About</div>
                                <div class="setting-subtitle">App information and version</div>
                            </div>
                            <div class="setting-arrow">→</div>
                        </div>
                    </div>
                </div>
                <div class="nav">
                    <a href="#" class="nav-item"><div class="nav-icon">🏠</div><div>Home</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📋</div><div>List</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">➕</div><div></div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📅</div><div>Calendar</div></a>
                    <a href="#" class="nav-item active"><div class="nav-icon">⚙️</div><div>Settings</div></a>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

function createListHTML(width, height) {
    const isLarge = width > 1100;
    const padding = isLarge ? '40px' : '30px';
    const fontSize = isLarge ? '42px' : '32px';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5; width: ${width}px; height: ${height}px; overflow: hidden;
            }
            .tablet-frame { width: 100%; height: 100%; background: #000; padding: ${padding}; border-radius: 20px; }
            .screen { width: 100%; height: 100%; background: #fff; border-radius: 15px; overflow: hidden; position: relative; }
            .header { text-align: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
            .title { font-size: ${fontSize}; font-weight: bold; color: #2c3e50; }
            .search-section { padding: 20px ${padding}; background: #f8f9fa; }
            .search-box {
                display: flex; align-items: center; background: white; border-radius: 25px;
                padding: 15px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .search-icon { color: #7f8c8d; margin-right: 15px; font-size: 20px; }
            .search-input { border: none; outline: none; flex: 1; font-size: 18px; color: #7f8c8d; }
            .filter-tabs { display: flex; gap: 15px; padding: 20px ${padding}; background: #f8f9fa; }
            .filter-tab {
                padding: 12px 20px; border-radius: 25px; font-size: 16px; font-weight: 600;
                text-decoration: none; transition: all 0.3s;
            }
            .filter-tab.active { background: #27ae60; color: white; }
            .filter-tab:not(.active) { background: white; color: #7f8c8d; border: 1px solid #e0e0e0; }
            .content-area {
                flex: 1; display: flex; flex-direction: column; align-items: center;
                justify-content: center; padding: 40px; background: #f8f9fa; min-height: 300px;
            }
            .empty-icon { font-size: ${isLarge ? '150px' : '120px'}; margin-bottom: 30px; opacity: 0.6; }
            .empty-message { font-size: ${isLarge ? '24px' : '20px'}; color: #7f8c8d; text-align: center; max-width: 400px; line-height: 1.5; }
            .nav { position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
                   background: white; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #e0e0e0; }
            .nav-item { display: flex; flex-direction: column; align-items: center; color: #7f8c8d; text-decoration: none; }
            .nav-item.active { color: #27ae60; }
            .nav-icon { font-size: 24px; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="tablet-frame">
            <div class="screen">
                <div class="header">
                    <div class="title">List</div>
                </div>
                <div class="search-section">
                    <div class="search-box">
                        <div class="search-icon">🔍</div>
                        <input type="text" class="search-input" placeholder="Search items..." />
                    </div>
                </div>
                <div class="filter-tabs">
                    <a href="#" class="filter-tab active">📋 All</a>
                    <a href="#" class="filter-tab">⚠️ Expired</a>
                    <a href="#" class="filter-tab">⏰ Expiring</a>
                    <a href="#" class="filter-tab">✅ Fresh</a>
                </div>
                <div class="content-area">
                    <div class="empty-icon">📦</div>
                    <div class="empty-message">No items found. Add some items to get started!</div>
                </div>
                <div class="nav">
                    <a href="#" class="nav-item"><div class="nav-icon">🏠</div><div>Home</div></a>
                    <a href="#" class="nav-item active"><div class="nav-icon">📋</div><div>List</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">➕</div><div></div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">📅</div><div>Calendar</div></a>
                    <a href="#" class="nav-item"><div class="nav-icon">⚙️</div><div>Settings</div></a>
                </div>
            </div>
        </div>
    </body>
    </html>`;
}

// Run the script
generateTabletScreenshots().catch(console.error); 