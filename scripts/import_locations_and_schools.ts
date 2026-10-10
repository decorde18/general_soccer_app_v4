import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { clubs_type, teams_gender } from '../src/generated/client';

function parseSqlTuples(sql: string, tableName: string): (string | null)[][] {
  const regex = new RegExp(`INSERT INTO [\\\`"']?${tableName}[\\\`"']?\\s*(\\(.*?\\))?\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
  const matches = [...sql.matchAll(regex)];
  const tuples: (string | null)[][] = [];

  for (const match of matches) {
    const rawStr = match[2];
    let current = '';
    let inString = false;
    let escape = false;
    let depth = 0;

    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr[i];
      if (escape) {
        current += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        current += char;
        escape = true;
        continue;
      }
      if (char === "'" || char === '"') {
        inString = !inString;
        current += char;
        continue;
      }
      if (!inString) {
        if (char === '(') {
          depth++;
          if (depth === 1) {
            current = '';
            continue;
          }
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            tuples.push(parseTupleFields(current));
            current = '';
            continue;
          }
        }
      }
      if (depth > 0) {
        current += char;
      }
    }
  }

  return tuples;
}

function parseTupleFields(tupleStr: string): (string | null)[] {
  const fields: string[] = [];
  let field = '';
  let inStr = false;
  let esc = false;

  for (let i = 0; i < tupleStr.length; i++) {
    const c = tupleStr[i];
    if (esc) {
      field += c;
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === "'") {
      inStr = !inStr;
      continue;
    }
    if (c === ',' && !inStr) {
      fields.push(field.trim());
      field = '';
      continue;
    }
    field += c;
  }
  fields.push(field.trim());

  return fields.map(f => {
    if (f === 'NULL' || f === 'null') return null;
    return f;
  });
}

export async function importLocationsAndSchools() {
  console.log('=== STARTING FAST BULK LOCATIONS, SUBLOCATIONS, ADDRESSES & SCHOOLS IMPORT ===');
  const sqlPath = path.resolve(process.cwd(), 'u676616277_hs_original.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found at ${sqlPath}`);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // --- Step 1: Parse and Migrate Addresses ---
  const addressTuples = parseSqlTuples(sql, 'addresses');
  console.log(`Parsed ${addressTuples.length} addresses from legacy SQL dump.`);

  let existingAddresses = await prisma.addresses.findMany();
  const addressMap = new Map<number, number>();

  const addressLookup = new Map<string, number>();
  existingAddresses.forEach(addr => {
    const key = `${(addr.address_line1 || '').trim().toLowerCase()}|${(addr.city || '').trim().toLowerCase()}|${(addr.state || '').trim().toLowerCase()}`;
    if (key.length > 2) {
      addressLookup.set(key, addr.id);
    }
  });

  const addressesToCreate: { address_line1: string | null; city: string | null; state: string | null; postal_code: string | null; country: string }[] = [];
  const pendingLegacyAddresses: { legacyId: number; key: string }[] = [];

  let addressesMatched = 0;

  for (const tuple of addressTuples) {
    const legacyId = Number(tuple[0]) || 0;
    const addressLine1 = (tuple[1] || '').trim() || null;
    const city = (tuple[2] || '').trim() || null;
    const zip = (tuple[3] || '').trim() || null;
    const state = (tuple[4] || '').trim() || null;

    if (!legacyId) continue;

    const key = `${(addressLine1 || '').toLowerCase()}|${(city || '').toLowerCase()}|${(state || '').toLowerCase()}`;
    if (key.length > 2 && addressLookup.has(key)) {
      const existingId = addressLookup.get(key)!;
      addressMap.set(legacyId, existingId);
      addressesMatched++;
    } else {
      addressesToCreate.push({
        address_line1: addressLine1,
        city: city,
        state: state,
        postal_code: zip ? String(zip) : null,
        country: 'USA'
      });
      pendingLegacyAddresses.push({ legacyId, key });
    }
  }

  if (addressesToCreate.length > 0) {
    console.log(`Bulk inserting ${addressesToCreate.length} new addresses...`);
    await prisma.addresses.createMany({
      data: addressesToCreate
    });
    existingAddresses = await prisma.addresses.findMany();
    existingAddresses.forEach(addr => {
      const key = `${(addr.address_line1 || '').trim().toLowerCase()}|${(addr.city || '').trim().toLowerCase()}|${(addr.state || '').trim().toLowerCase()}`;
      if (key.length > 2) {
        addressLookup.set(key, addr.id);
      }
    });

    for (const pending of pendingLegacyAddresses) {
      if (addressLookup.has(pending.key)) {
        addressMap.set(pending.legacyId, addressLookup.get(pending.key)!);
      }
    }
  }
  console.log(`Addresses migration finished. Total matched: ${addressesMatched}, Total created: ${addressesToCreate.length}`);

  // --- Step 2: Parse and Migrate Locations ---
  const locationTuples = parseSqlTuples(sql, 'locations');
  console.log(`Parsed ${locationTuples.length} locations from legacy SQL dump.`);

  let existingLocations = await prisma.locations.findMany();
  const locationMap = new Map<number, number>();

  const locationLookup = new Map<string, typeof existingLocations[0]>();
  existingLocations.forEach(loc => {
    const key = loc.name.trim().toLowerCase();
    locationLookup.set(key, loc);
  });

  const locationsToCreate: { name: string; address_id: number | null }[] = [];
  const pendingLegacyLocations: { legacyId: number; nameKey: string }[] = [];

  let locationsMatched = 0;
  let locationsUpdated = 0;

  for (const tuple of locationTuples) {
    const legacyId = Number(tuple[0]) || 0;
    const name = (tuple[1] || '').trim();
    const legacyAddressId = tuple[2] ? Number(tuple[2]) : null;

    if (!legacyId || !name) continue;

    const targetAddressId = legacyAddressId ? (addressMap.get(legacyAddressId) || null) : null;
    const nameKey = name.toLowerCase();

    if (locationLookup.has(nameKey)) {
      const existingLoc = locationLookup.get(nameKey)!;
      locationMap.set(legacyId, existingLoc.id);
      locationsMatched++;

      if (!existingLoc.address_id && targetAddressId) {
        await prisma.locations.update({
          where: { id: existingLoc.id },
          data: { address_id: targetAddressId }
        });
        existingLoc.address_id = targetAddressId;
        locationsUpdated++;
      }
    } else {
      locationsToCreate.push({
        name: name,
        address_id: targetAddressId
      });
      pendingLegacyLocations.push({ legacyId, nameKey });
    }
  }

  if (locationsToCreate.length > 0) {
    console.log(`Bulk inserting ${locationsToCreate.length} new locations...`);
    await prisma.locations.createMany({
      data: locationsToCreate
    });
    existingLocations = await prisma.locations.findMany();
    existingLocations.forEach(loc => {
      locationLookup.set(loc.name.trim().toLowerCase(), loc);
    });

    for (const pending of pendingLegacyLocations) {
      if (locationLookup.has(pending.nameKey)) {
        locationMap.set(pending.legacyId, locationLookup.get(pending.nameKey)!.id);
      }
    }
  }
  console.log(`Locations migration finished. Total matched: ${locationsMatched}, Total created: ${locationsToCreate.length}, Updated addresses: ${locationsUpdated}`);

  // --- Step 3: Ensure Sublocations exist for every Location ---
  const allLocations = await prisma.locations.findMany({
    include: { locations_sublocations: true }
  });

  const locationIdToAddressIdMap = new Map<number, number | null>();
  allLocations.forEach(l => locationIdToAddressIdMap.set(l.id, l.address_id));

  const sublocationsToCreate: { location_id: number; name: string; surface_type: string; is_active: boolean }[] = [];
  for (const loc of allLocations) {
    if (loc.locations_sublocations.length === 0) {
      sublocationsToCreate.push({
        location_id: loc.id,
        name: 'Main Field',
        surface_type: 'Grass',
        is_active: true
      });
    }
  }

  if (sublocationsToCreate.length > 0) {
    console.log(`Bulk inserting ${sublocationsToCreate.length} default sublocations...`);
    await prisma.locations_sublocations.createMany({
      data: sublocationsToCreate
    });
  }
  console.log(`Sublocations migration finished. Total sublocations created: ${sublocationsToCreate.length}`);

  // --- Step 4: Parse and Migrate Schools (Clubs of type 'high_school') ---
  const schoolTuples = parseSqlTuples(sql, 'schools');
  console.log(`Parsed ${schoolTuples.length} schools from legacy SQL dump.`);

  let existingClubs = await prisma.clubs.findMany();
  const clubMap = new Map<number, number>();

  const clubLookupByName = new Map<string, typeof existingClubs[0]>();
  const clubLookupByAbbr = new Map<string, typeof existingClubs[0]>();

  existingClubs.forEach(c => {
    clubLookupByName.set(c.name.trim().toLowerCase(), c);
    if (c.abbreviation) {
      clubLookupByAbbr.set(c.abbreviation.trim().toLowerCase(), c);
    }
  });

  const clubsToCreate: { name: string; abbreviation: string | null; type: clubs_type; location_id: number | null; is_active: boolean }[] = [];
  const pendingLegacySchools: { legacyId: number; nameKey: string; abbrKey: string | null }[] = [];

  let schoolsMatched = 0;
  let schoolsUpdated = 0;

  for (const tuple of schoolTuples) {
    const legacyId = Number(tuple[0]) || 0;
    const schoolName = (tuple[1] || '').trim();
    const shortName = (tuple[2] || '').trim() || null;
    const abbr = (tuple[3] || '').trim() || null;
    const legacyHomeLocId = tuple[4] ? Number(tuple[4]) : null;

    if (!legacyId || !schoolName) continue;

    let targetAddressId: number | null = null;
    if (legacyHomeLocId && locationMap.has(legacyHomeLocId)) {
      const targetLocId = locationMap.get(legacyHomeLocId)!;
      targetAddressId = locationIdToAddressIdMap.get(targetLocId) || null;
    }

    const nameKey = schoolName.toLowerCase();
    const abbrKey = abbr ? abbr.toLowerCase() : null;

    let existingClub = clubLookupByName.get(nameKey) || (abbrKey ? clubLookupByAbbr.get(abbrKey) : null);

    if (existingClub) {
      clubMap.set(legacyId, existingClub.id);
      schoolsMatched++;

      const needsTypeUpdate = existingClub.type !== 'high_school';
      const needsLocUpdate = !existingClub.location_id && targetAddressId !== null;

      if (needsTypeUpdate || needsLocUpdate) {
        await prisma.clubs.update({
          where: { id: existingClub.id },
          data: {
            type: 'high_school',
            ...(needsLocUpdate ? { location_id: targetAddressId } : {})
          }
        });
        schoolsUpdated++;
      }
    } else {
      clubsToCreate.push({
        name: schoolName,
        abbreviation: abbr,
        type: 'high_school',
        location_id: targetAddressId,
        is_active: true
      });
      pendingLegacySchools.push({ legacyId, nameKey, abbrKey });
    }
  }

  if (clubsToCreate.length > 0) {
    console.log(`Bulk inserting ${clubsToCreate.length} new high school clubs...`);
    await prisma.clubs.createMany({
      data: clubsToCreate
    });

    existingClubs = await prisma.clubs.findMany();
    existingClubs.forEach(c => {
      clubLookupByName.set(c.name.trim().toLowerCase(), c);
      if (c.abbreviation) {
        clubLookupByAbbr.set(c.abbreviation.trim().toLowerCase(), c);
      }
    });

    for (const pending of pendingLegacySchools) {
      const found = clubLookupByName.get(pending.nameKey) || (pending.abbrKey ? clubLookupByAbbr.get(pending.abbrKey) : null);
      if (found) {
        clubMap.set(pending.legacyId, found.id);
      }
    }
  }
  console.log(`Schools migration finished. Total matched: ${schoolsMatched}, Total created: ${clubsToCreate.length}, Updated: ${schoolsUpdated}`);

  // --- Step 5: Ensure Default Teams for High School Clubs ---
  const allHsClubs = await prisma.clubs.findMany({
    where: { type: 'high_school' },
    include: { teams: true }
  });

  const teamsToCreate: { club_id: number; team_name: string; gender: teams_gender; is_active: boolean }[] = [];

  for (const hsClub of allHsClubs) {
    if (hsClub.teams.length === 0) {
      teamsToCreate.push(
        { club_id: hsClub.id, team_name: 'Varsity Boys', gender: 'MALE' as teams_gender, is_active: true },
        { club_id: hsClub.id, team_name: 'Varsity Girls', gender: 'FEMALE' as teams_gender, is_active: true },
        { club_id: hsClub.id, team_name: 'JV Boys', gender: 'MALE' as teams_gender, is_active: true },
        { club_id: hsClub.id, team_name: 'JV Girls', gender: 'FEMALE' as teams_gender, is_active: true }
      );
    }
  }

  if (teamsToCreate.length > 0) {
    console.log(`Bulk inserting ${teamsToCreate.length} default high school teams...`);
    await prisma.teams.createMany({
      data: teamsToCreate
    });
  }
  console.log(`Default High School Teams created: ${teamsToCreate.length}`);

  // --- Step 6: Create Team Seasons for All High School Teams ---
  const activeSeasons = await prisma.seasons.findMany({ orderBy: { start_date: 'desc' } });
  const allHsTeams = await prisma.teams.findMany({
    where: {
      clubs: { type: 'high_school' }
    }
  });

  const teamSeasonsToCreate: { team_id: number; season_id: number; is_active: boolean }[] = [];

  for (const team of allHsTeams) {
    for (const season of activeSeasons) {
      teamSeasonsToCreate.push({
        team_id: team.id,
        season_id: season.id,
        is_active: true
      });
    }
  }

  if (teamSeasonsToCreate.length > 0) {
    console.log(`Bulk creating ${teamSeasonsToCreate.length} team_seasons for high school teams...`);
    await prisma.team_seasons.createMany({
      data: teamSeasonsToCreate,
      skipDuplicates: true
    });
  }
  console.log(`Team Seasons creation completed.`);

  console.log('=== COMPLETED FAST BULK LOCATIONS, SUBLOCATIONS, ADDRESSES & SCHOOLS IMPORT ===');
  return {
    addressesCreated: addressesToCreate.length,
    addressesMatched,
    locationsCreated: locationsToCreate.length,
    locationsMatched,
    locationsUpdated,
    sublocationsCreated: sublocationsToCreate.length,
    schoolsCreated: clubsToCreate.length,
    schoolsMatched,
    schoolsUpdated,
    teamsCreated: teamsToCreate.length,
    teamSeasonsCreated: teamSeasonsToCreate.length
  };
}

if (require.main === module) {
  importLocationsAndSchools()
    .then(results => {
      console.log('Results:', results);
      process.exit(0);
    })
    .catch(err => {
      console.error('Import Error:', err);
      process.exit(1);
    });
}
