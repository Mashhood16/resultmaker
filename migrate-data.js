const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const db = new Database(path.join(__dirname, 'prisma', 'dev.db'));

async function main() {
  console.log('Fetching data from local SQLite...');
  
  const schools = db.prepare('SELECT * FROM School').all();
  const classes = db.prepare('SELECT * FROM Class').all();
  const subjects = db.prepare('SELECT * FROM Subject').all();
  const students = db.prepare('SELECT * FROM Student').all();
  const scores = db.prepare('SELECT * FROM Score').all();

  console.log(`Found ${schools.length} schools, ${classes.length} classes, ${subjects.length} subjects, ${students.length} students, ${scores.length} scores.`);

  console.log('Clearing remote database...');
  await prisma.score.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.school.deleteMany();

  console.log('Inserting Schools...');
  await prisma.school.createMany({ 
    data: schools.map(s => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })) 
  });
  
  console.log('Inserting Classes...');
  await prisma.class.createMany({ 
    data: classes.map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })) 
  });
  
  console.log('Inserting Subjects...');
  await prisma.subject.createMany({ 
    data: subjects.map(s => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })) 
  });
  
  console.log('Inserting Students...');
  const chunkSize = 1000;
  for (let i = 0; i < students.length; i += chunkSize) {
    const chunk = students.slice(i, i + chunkSize);
    await prisma.student.createMany({ 
      data: chunk.map(s => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })) 
    });
  }

  console.log('Inserting Scores...');
  for (let i = 0; i < scores.length; i += chunkSize) {
    const chunk = scores.slice(i, i + chunkSize);
    await prisma.score.createMany({ 
      data: chunk.map(s => ({ 
        ...s, 
        isAbsent: s.isAbsent === 1,
        createdAt: new Date(s.createdAt), 
        updatedAt: new Date(s.updatedAt) 
      })) 
    });
  }

  console.log('Data migration to Vercel Postgres complete!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    db.close();
  });
