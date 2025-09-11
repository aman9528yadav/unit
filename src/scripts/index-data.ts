
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';
import { conversionCategories } from '../lib/conversions';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Initialize Algolia
const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string, process.env.ALGOLIA_ADMIN_KEY as string);
const index = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME as string);

const db = admin.firestore();

async function indexData() {
  console.log('Starting data indexing...');

  const usersSnapshot = await db.collection('users').get();
  const allObjects:any = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userEmail = userData.email;

    // Index Notes
    if (userData.notes) {
      userData.notes.forEach((note: any) => {
        if (!note.deletedAt) {
          allObjects.push({
            objectID: note.id,
            type: 'Note',
            title: note.title,
            description: note.content.replace(/<[^>]*>?/gm, '').substring(0, 500),
            href: `/notes/edit/${note.id}`,
            user: userEmail,
          });
        }
      });
    }

    // Index History
    if (userData.conversionHistory) {
      userData.conversionHistory.forEach((h: string, i: number) => {
        allObjects.push({
          objectID: `${userEmail}_history_${i}`,
          type: 'History',
          title: h.split('|')[0],
          href: '/converter',
          user: userEmail,
        });
      });
    }
    
    // Index Custom Units & Categories
    if (userData.customUnits) {
        userData.customUnits.forEach((unit: any) => {
            allObjects.push({
                objectID: unit.symbol,
                type: 'Unit',
                title: `${unit.name} (${unit.symbol})`,
                href: '/converter',
                user: userEmail
            });
        });
    }
  }
  
    // Index Static data (Help, Settings, Categories, Units)
    // For simplicity, we'll add them for all users. 
    // A better approach might be to index them once and not tie them to a user, 
    // but this requires changing the search logic to perform two queries (one for user data, one for global data).

    const settingsPages = [
        { title: 'General Settings', description: 'Configure your application settings.', href: '/settings' },
        { title: 'Custom Units', description: 'Manage your custom conversion units.', href: '/settings/custom-units' },
        { title: 'Theme', description: 'Change the look and feel of the app.', href: '/settings/theme' },
        { title: 'Developer', description: 'Developer-specific settings and tools.', href: '/dev' },
    ];

    settingsPages.forEach(p => {
        allObjects.push({
            objectID: p.href,
            type: 'Setting',
            title: p.title,
            description: p.description,
            href: p.href,
            user: 'guest' // Or some other generic identifier
        });
    });
    
    conversionCategories.forEach(c => {
        allObjects.push({
            objectID: c.name,
            type: 'Category',
            title: `Category: ${c.name}`,
            description: `Go to the ${c.name} converter`,
            href: '/converter',
            user: 'guest'
        });
        c.units.forEach(u => {
            allObjects.push({
                objectID: u.symbol,
                type: 'Unit',
                title: `${u.name} (${u.symbol})`,
                href: '/converter',
                user: 'guest'
            });
        });
    });


  // Upload to Algolia
  try {
    await index.saveObjects(allObjects);
    console.log('Successfully indexed all data.');
  } catch (error) {
    console.error('Error indexing data to Algolia:', error);
  }
}

indexData();
