import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log('here')
  const body = await req.json();
  const { userId, tokenToList, ...propertyData } = body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        tokens: {
          create: {
            user: { connect: { id: userId } },
            numberOfTokens: propertyData.tokensMinted,
          },
        },
      },
    });

    if (tokenToList > 0) {
      const response = await fetch("/api/listing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          propertyId: property.id,
          tokens: tokenToList,
        }),
      });

      if (!response.ok) {
        return new NextResponse("Failed to list tokens for new property", {
          status: 404,
        });
      }
    } else {
      await prisma.property.update({
        where: { id: property.id },
        data: { tokensforSale: 0 },
      });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to create property", { status: 500 });
  }
}
