import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/User.js";
import mongoose from "mongoose";

// Test musicians spread across Greek cities, for exercising Discover's
// filters, distance bands and compatibility scoring locally.
const PROFILES = [
  {
    name: "Nikos Kithara",
    email: "nikos.athens@jamminspot.dev",
    city: "Athens",
    coordinates: [23.7275, 37.9838],
    specialties: ["instrumentalist"],
    instruments: ["guitar"],
    goals: ["form_band", "record_music"],
    genres: ["indie_alternative", "rock"],
    bio: "Guitarist in Athens chasing that 90s alt-rock sound. Looking for a band to write and record with.",
  },
  {
    name: "Eleni Voice",
    email: "eleni.thessaloniki@jamminspot.dev",
    city: "Thessaloniki",
    coordinates: [22.9444, 40.6401],
    specialties: ["vocalist"],
    vocalSkills: ["lead_vocals"],
    goals: ["find_collaborators", "join_band"],
    genres: ["indie_alternative", "experimental"],
    bio: "Lead vocalist based in Thessaloniki, into atmospheric and experimental indie. Open to remote collabs too.",
  },
  {
    name: "Dimitris Beats",
    email: "dimitris.patra@jamminspot.dev",
    city: "Patra",
    coordinates: [21.7346, 38.2466],
    specialties: ["producer", "dj"],
    goals: ["produce_music", "remote_collaboration"],
    genres: ["edm", "hip_hop"],
    bio: "EDM/hip-hop producer and DJ from Patra. I build beats fast and love working with vocalists remotely.",
  },
  {
    name: "Sofia Drums",
    email: "sofia.heraklion@jamminspot.dev",
    city: "Heraklion",
    coordinates: [25.1442, 35.3387],
    specialties: ["instrumentalist"],
    instruments: ["drums"],
    goals: ["join_band", "live_performances"],
    genres: ["punk", "rock"],
    bio: "Drummer in Heraklion, hits hard, plays punk and rock. Want to gig, not just jam in a garage.",
  },
  {
    name: "Yannis Bass",
    email: "yannis.larissa@jamminspot.dev",
    city: "Larissa",
    coordinates: [22.4191, 39.639],
    specialties: ["instrumentalist"],
    instruments: ["bass"],
    goals: ["form_band", "casual_jam"],
    genres: ["funk", "jazz"],
    bio: "Bassist in Larissa with a soft spot for funk and jazz grooves. Down for a casual jam or a real project.",
  },
  {
    name: "Katerina Synth",
    email: "katerina.volos@jamminspot.dev",
    city: "Volos",
    coordinates: [22.9425, 39.3622],
    specialties: ["producer"],
    instruments: ["synth", "keys"],
    goals: ["produce_music", "find_vocalists"],
    genres: ["ambient", "cinematic"],
    bio: "I make ambient and cinematic soundscapes from my home studio in Volos. Looking for a vocalist to top a few tracks.",
  },
  {
    name: "Petros Strings",
    email: "petros.ioannina@jamminspot.dev",
    city: "Ioannina",
    coordinates: [20.8537, 39.665],
    specialties: ["instrumentalist"],
    instruments: ["violin", "guitar"],
    goals: ["session_work", "find_collaborators"],
    genres: ["folk", "acoustic", "classical"],
    bio: "Classically trained violinist and guitarist in Ioannina, available for session work on folk and acoustic tracks.",
  },
  {
    name: "Maria Engineer",
    email: "maria.chania@jamminspot.dev",
    city: "Chania",
    coordinates: [24.018, 35.5138],
    specialties: ["sound_engineer"],
    goals: ["record_music", "session_work"],
    genres: ["rock", "metal", "blues"],
    bio: "Sound engineer running a small studio in Chania — recording, mixing, mastering for rock, metal and blues acts.",
  },
  {
    name: "Alexandros Mic",
    email: "alexandros.kavala@jamminspot.dev",
    city: "Kavala",
    coordinates: [24.4023, 40.9396],
    specialties: ["vocalist"],
    vocalSkills: ["rap"],
    goals: ["find_musicians_for_project", "produce_music"],
    genres: ["hip_hop", "rnb"],
    bio: "Rapper from Kavala with an EP half-written. Looking for a producer or band to finish it with.",
  },
  {
    name: "Christina Keys",
    email: "christina.rhodes@jamminspot.dev",
    city: "Rhodes",
    coordinates: [28.2176, 36.4341],
    specialties: ["instrumentalist", "vocalist"],
    instruments: ["piano"],
    vocalSkills: ["lead_vocals", "harmony"],
    goals: ["live_performances", "meet_musicians"],
    genres: ["pop", "laiko", "entekhno"],
    bio: "Piano and vocals, based in Rhodes. Play pop and entekhno covers live most weekends — always up for meeting other musicians.",
  },
];

async function seed() {
  await connectDB();
  const passwordHash = await bcrypt.hash("testpass123", 10);

  for (const p of PROFILES) {
    const specialties = p.specialties;
    const hasCore = specialties?.length && p.goals?.length && p.genres?.length;

    await User.findOneAndUpdate(
      { email: p.email },
      {
        $set: {
          email: p.email,
          passwordHash,
          name: p.name,
          bio: p.bio,
          specialties,
          instruments: p.instruments || [],
          vocalSkills: p.vocalSkills || [],
          goals: p.goals,
          genres: p.genres,
          location: {
            type: "Point",
            coordinates: p.coordinates,
            city: p.city,
            country: "Greece",
          },
          onboardingComplete: Boolean(hasCore),
        },
      },
      { upsert: true, new: true }
    );
    console.log(`[seed] upserted ${p.name} (${p.city})`);
  }

  // Give the two accounts from the manual test session an Athens location
  // too, so distance-based scoring has something to compute against them.
  await User.updateMany(
    { email: { $in: ["chris.test@jamminspot.dev", "maria.test@jamminspot.dev"] } },
    {
      $set: {
        location: { type: "Point", coordinates: [23.7275, 37.9838], city: "Athens", country: "Greece" },
      },
    }
  );

  console.log(`[seed] done — password for all seeded accounts: testpass123`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
