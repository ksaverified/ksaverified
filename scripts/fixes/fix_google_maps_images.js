require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function getBusinessImages(businessTypesStr) {
    businessTypesStr = businessTypesStr.toLowerCase();
    if (businessTypesStr.includes('hair') || businessTypesStr.includes('barber') || businessTypesStr.includes('salon') || businessTypesStr.includes('saloon') || businessTypesStr.includes('grooming') || businessTypesStr.includes('حلاقة')) {
        return [
            "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1512496015851-a1c84877bc99?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('repair') || businessTypesStr.includes('electronics') || businessTypesStr.includes('computer')) {
        return [
            "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1574824874457-3fb2d887be17?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('restaurant') || businessTypesStr.includes('cafe') || businessTypesStr.includes('food')) {
        return [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1466978913421-bac2e5e427a5?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('boutique') || businessTypesStr.includes('fashion') || businessTypesStr.includes('dress') || businessTypesStr.includes('clothes') || businessTypesStr.includes('ملابس') || businessTypesStr.includes('ازياء')) {
        return [
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1445205174273-59396b27d33b?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534126511673-b6899657816a?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1485231183945-80f6880da6d8?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('clinic') || businessTypesStr.includes('medical') || businessTypesStr.includes('doctor') || businessTypesStr.includes('health') || businessTypesStr.includes('عيادة') || businessTypesStr.includes('طبي')) {
        return [
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('supermarket') || businessTypesStr.includes('grocery') || businessTypesStr.includes('store') || businessTypesStr.includes('market') || businessTypesStr.includes('بقالة') || businessTypesStr.includes('سوبر')) {
        return [
            "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-147119394590b-35623395feb4?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1444858291040-58f756a3bea6?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1594918352528-665e8a9f626a?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('carwash') || businessTypesStr.includes('car wash') || businessTypesStr.includes('detailing') || businessTypesStr.includes('غسيل')) {
        return [
            "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1601362840469-51e4d8d59085?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1629815197818-f60be2806ee3?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552933153-43d4479bd7ac?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599256621730-535171e28e50?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1597766333691-4569bd898c69?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507136566006-bb7aef5537d8?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('spa') || businessTypesStr.includes('massage') || businessTypesStr.includes('beauty parlor') || businessTypesStr.includes('سبا')) {
        return [
             "https://images.unsplash.com/photo-1544161515-4af6b1d4b1f2?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1540555700478-4be289aefcf1?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1611099683487-de5d7a9adcbf?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('sport') || businessTypesStr.includes('gym') || businessTypesStr.includes('fitness') || businessTypesStr.includes('رياضة')) {
        return [
             "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('flower') || businessTypesStr.includes('gift') || businessTypesStr.includes('ورد') || businessTypesStr.includes('هدايا')) {
        return [
             "https://images.unsplash.com/photo-1522673607200-164883efbfc1?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1490750967868-88aa3386c946?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1549462184-b09b977a8364?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1523626752472-b55a6d7f1c0a?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1487070183336-b8d23f722005?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1453904300235-0f2f60b15b5d?q=80&w=1000&auto=format&fit=crop"
        ];
    } else if (businessTypesStr.includes('construct') || businessTypesStr.includes('contractor') || businessTypesStr.includes('build') || businessTypesStr.includes('مقاول') || businessTypesStr.includes('بناء')) {
        return [
             "https://images.unsplash.com/photo-1503387762-11a0fcfbd307?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1504307651254-35680f3366d4?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1531834357221-ed7c2936279d?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1581094288338-2314dddb7ec4?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1508450859948-4e04f9ad5b13?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1517581177682-a0833a0a1c61?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?q=80&w=1000&auto=format&fit=crop"
        ];
    } else {
        return [
             "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
             "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop"
        ];
    }
}

async function run() {
    console.log("Checking for leads with maps.googleapis.com images...");
    const { data: leads, error } = await supabase
        .from('leads')
        .select('place_id, name, website_html')
        .neq('website_html', null)
        .like('website_html', '%maps.googleapis.com%');

    if (error) {
        console.error("DB Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("No affected websites found.");
        return;
    }

    console.log(`Found ${leads.length} affected websites. Beginning fix...`);
    const googleMapsRegex = /https:\/\/maps\.googleapis\.com\/maps\/api\/place\/photo\?[^"'\s)]+/g;

    let fixedCount = 0;
    let failedCount = 0;

    for (const lead of leads) {
        try {
            const businessTypesStr = ((lead.types || []).join(' ') + ' ' + (lead.name || '')).toLowerCase();
            const businessImages = getBusinessImages(businessTypesStr);
            
            let imgIndex = 0;
            const getNextImage = () => businessImages[imgIndex++ % businessImages.length];

            let cleanedHtml = lead.website_html.replace(googleMapsRegex, getNextImage);

            // Double check if any remain
            if (cleanedHtml.includes('maps.googleapis.com/maps/api/place/photo')) {
                console.warn(`[WARNING] Failed to clean all images for ${lead.name}`);
                failedCount++;
                continue;
            }

            // Update in Supabase
            const { error: updateError } = await supabase
                .from('leads')
                .update({ website_html: cleanedHtml })
                .eq('place_id', lead.place_id);

            if (updateError) {
                console.error(`[ERROR] Failed to update ${lead.name} in DB:`, updateError);
                failedCount++;
            } else {
                fixedCount++;
                if (fixedCount % 20 === 0) {
                    console.log(`Progress: Fixed ${fixedCount}/${leads.length}`);
                }
            }

        } catch (e) {
             console.error(`[ERROR] Processing ${lead.name}:`, e.message);
             failedCount++;
        }
    }

    console.log(`\n============== REPORT ==============`);
    console.log(`Total Found: ${leads.length}`);
    console.log(`Successfully Fixed: ${fixedCount}`);
    console.log(`Failed/Skipped: ${failedCount}`);
    console.log(`====================================`);
}

run();
