import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF PRISMA INITIALIZATION
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET: Fetch all tasks for a specific lead
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST: Add a new task to a lead
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, title, dueDate, assignedTo } = body;

    if (!leadId || !title || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        leadId,
        title,
        // Ensure date string is converted to proper ISO format for SQLite
        dueDate: new Date(dueDate).toISOString(), 
        assignedTo: assignedTo || "Unassigned"
      }
    });

    // Automatically generate an Activity Log entry to show the timeline
    await prisma.activityLog.create({
      data: {
        leadId,
        action: "TASK_CREATED",
        details: `Task added: "${title}" due on ${new Date(dueDate).toLocaleDateString()}`,
        performedBy: assignedTo || "System"
      }
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH: Toggle task completion status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isCompleted, performedBy } = body;

    if (!id || typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { isCompleted }
    });

    // Log the completion activity
    if (isCompleted) {
      await prisma.activityLog.create({
        data: {
          leadId: updatedTask.leadId,
          action: "TASK_COMPLETED",
          details: `Task completed: "${updatedTask.title}"`,
          performedBy: performedBy || "System"
        }
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}