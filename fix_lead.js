require('dotenv').config({path: '.env'});
const fs = require('fs');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const PublisherAgent = require('./agents/publisher');
const DatabaseService = require('./services/db');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function init() {
  console.log('Fetching Lead Data...');
  const { data, error } = await supabase.from('leads').select('*').eq('place_id', 'ChIJqV423i4BLz4REEeq0ojBEds').single();
  if (error) {
    console.error('Lead not found:', error.message);
    return;
  }
  
  let html = data.website_html;
  const phone = data.phone;
  const slug = data.slug;
  const vercel_url = data.vercel_url || ('https://' + slug + '.vercel.app');
  
  console.log('Lead Phone:', phone, 'Slug:', slug);

  // Find unique Pexels image URLs currently in the HTML
  const pexelsUrls = [...new Set(html.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/[^\"\'\s\?]+/g) || [])];
  console.log('Unique images to replace:', pexelsUrls.length);
  
  const searchTerms = ['smartphone repair screen', 'laptop repair technician', 'tablet screen repair', 'circuit board soldering', 'gaming console repair', 'data recovery hard drive', 'computer repair shop inside'];
  let newImages = [];
  
  // Fetch fresh images
  for (const term of searchTerms) {
    try {
      const res = await axios.get('https://api.pexels.com/v1/search?query=' + encodeURIComponent(term) + '&per_page=3&orientation=landscape', {
        headers: { Authorization: process.env.PEXELS_API_KEY }
      });
      if (res.data.photos && res.data.photos.length > 0) {
        newImages.push(res.data.photos[0].src.large);
      }
    } catch(e) { console.error('Pexels error:', e.message); }
  }
  
  console.log('Fetched ' + newImages.length + ' new images from Pexels.');
  
  // Actually replace URLs matching the base structure
  for (let i = 0; i < pexelsUrls.length; i++) {
     if (i < newImages.length) {
       // Replace the full original url including query params
       const escapedOldBase = pexelsUrls[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       const regex = new RegExp(escapedOldBase + '.*?(?=\\\"|\\\')', 'g');
       html = html.replace(regex, newImages[i]);
     }
  }

  // Update Supabase
  console.log('Saving updated HTML back to Supabase...');
  await supabase.from('leads').update({ website_html: html }).eq('place_id', 'ChIJqV423i4BLz4REEeq0ojBEds');
  console.log('Updated HTML in database.');

  // Redeploy via Publisher
  console.log('Redeploying to Vercel...');
  const publisher = new PublisherAgent();
  let freshUrl = '';
  try {
     freshUrl = await publisher.handlePublish('ChIJqV423i4BLz4REEeq0ojBEds', slug);
     console.log('Deployed to:', freshUrl);
  } catch (pubErr) {
     console.error('Vercel Deploy Error:', pubErr.message);
     freshUrl = vercel_url; 
  }

  // Send WhatsApp notification
  console.log('Sending WhatsApp follow-up message...');
  const msg = 'مرحباً! لقد لاحظنا اهتمامك بموقعك الإلكتروني الجديد لـ صيانه إلكترونيات 💎.\nلقد قمت بتحديث الصور خصيصاً لتناسب خدمات صيانة الإلكترونيات والهواتف الذكية!\nيمكنك معاينة النسخة المُحدثة هنا: ' + freshUrl + '\n\nلا تتردد في إخباري إذا كنت ترغب في أي تعديلات إضافية! هل ترغب في تفعيل الموقع؟';
  try {
     const waUrl = process.env.WHATSAPP_SERVICE_URL || 'https://adelaida-ferulaceous-hypsometrically.ngrok-free.dev';
     await axios.post(waUrl + '/send', { to: phone, message: msg });
     console.log('WhatsApp message sent to ' + phone);
     
     // Log outbound message in Database
     const db = new DatabaseService();
     await db.saveOutboundChatLog('ChIJqV423i4BLz4REEeq0ojBEds', phone, msg);
     await db.addLog('closer', 'followup_sent_manual', 'ChIJqV423i4BLz4REEeq0ojBEds', { name: data.name }, 'success');
  } catch(e) {
     console.error('WhatsApp send failed:', e.message);
  }
}
init();
