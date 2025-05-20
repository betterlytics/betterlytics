
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SITE_ID = 'default-site';

const siteData: Prisma.SiteCreateInput = {
  siteId: SITE_ID,
}

const funnelData = {
  name: 'Basic funnel',
  siteId: SITE_ID,
  pages: [
    '/dashboard',
    '/dashboard/pages',
    '/dashboard/geography',
  ]
}


export async function main() {
  // Create site
  const siteExists = await prisma.site.findFirst({
    where: {
      siteId: siteData.siteId
    }
  });

  if (!siteExists) { 
    await prisma.site.create({ data: siteData });
  }

  // Create funnel
  const funnelExists = await prisma.funnel.findFirst({
    where: {
      name: funnelData.name
    }
  });

  if (!funnelExists) {  
    await prisma.funnel.create({
      data: funnelData
    });
  }
}

main()
