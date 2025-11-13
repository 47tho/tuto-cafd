import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client for auth
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Helper function to verify user
async function verifyUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  return user;
}

// Helper to generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Health check endpoint
app.get("/make-server-9ffbf00b/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== AUTH ROUTES ==========

// Sign up
app.post("/make-server-9ffbf00b/auth/signup", async (c) => {
  try {
    const { email, password, name, role, carrera, bio, subjects } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Prevent registration as admin
    if (role === 'admin') {
      return c.json({ error: "Admin registration is not allowed" }, 403);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since email server hasn't been configured
      user_metadata: { name, role }
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    // Store user profile in KV
    const userId = data.user.id;
    const userProfile: any = {
      id: userId,
      email,
      name,
      role, // 'student', 'tutor' (admin registration is not allowed)
      createdAt: new Date().toISOString()
    };

    if (role === 'student') {
      userProfile.carrera = carrera || '';
      userProfile.whatsapp = '';
      userProfile.rating = 0; // Students also have ratings now
      userProfile.reviewCount = 0;
    } else if (role === 'tutor') {
      userProfile.bio = bio || '';
      userProfile.subjects = subjects || [];
      userProfile.whatsapp = '';
      userProfile.approved = false; // Tutors need approval
      userProfile.rating = 0;
      userProfile.reviewCount = 0;
    }

    await kv.set(`user:${userId}`, userProfile);

    // Add to pending tutors list if tutor
    if (role === 'tutor') {
      const pending = await kv.get('tutors:pending') || [];
      pending.push(userId);
      await kv.set('tutors:pending', pending);
    }

    return c.json({ 
      success: true, 
      userId,
      role,
      needsApproval: role === 'tutor'
    });

  } catch (error: any) {
    console.log(`Signup error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Sign in
app.post("/make-server-9ffbf00b/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Sign in error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    if (!data.session || !data.user) {
      return c.json({ error: "Failed to sign in" }, 500);
    }

    // Get user profile
    const userProfile = await kv.get(`user:${data.user.id}`);
    
    return c.json({ 
      accessToken: data.session.access_token,
      user: userProfile
    });

  } catch (error: any) {
    console.log(`Sign in error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get current session
app.get("/make-server-9ffbf00b/auth/session", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    return c.json({ user: userProfile });

  } catch (error: any) {
    console.log(`Session error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== PROFILE ROUTES ==========

// Update profile
app.put("/make-server-9ffbf00b/profile", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const updatedProfile = { ...currentProfile, ...updates };
    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ success: true, user: updatedProfile });

  } catch (error: any) {
    console.log(`Profile update error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== TUTOR ROUTES ==========

// Search tutors
app.get("/make-server-9ffbf00b/tutors/search", async (c) => {
  try {
    const materia = c.req.query('materia');
    const minRating = c.req.query('minRating');
    
    // Get approved tutors
    const approvedIds = await kv.get('tutors:approved') || [];
    const tutorProfiles = [];

    for (const tutorId of approvedIds) {
      const profile = await kv.get(`user:${tutorId}`);
      if (profile && profile.approved) {
        // Filter by subject if specified
        if (materia && !profile.subjects.includes(materia)) {
          continue;
        }
        // Filter by rating if specified
        if (minRating && profile.rating < parseFloat(minRating)) {
          continue;
        }
        tutorProfiles.push(profile);
      }
    }

    return c.json({ tutors: tutorProfiles });

  } catch (error: any) {
    console.log(`Tutor search error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get tutor profile
app.get("/make-server-9ffbf00b/tutors/:id", async (c) => {
  try {
    const tutorId = c.req.param('id');
    const profile = await kv.get(`user:${tutorId}`);
    
    if (!profile || profile.role !== 'tutor') {
      return c.json({ error: "Tutor not found" }, 404);
    }

    // Get tutor's reviews
    const allReviews = await kv.getByPrefix('review:');
    const tutorReviews = allReviews
      .filter(r => r.tutorId === tutorId && r.approved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ tutor: profile, reviews: tutorReviews });

  } catch (error: any) {
    console.log(`Get tutor error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get tutor availability
app.get("/make-server-9ffbf00b/tutors/:id/availability", async (c) => {
  try {
    const tutorId = c.req.param('id');
    const availability: any = {};
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      const slots = await kv.get(`availability:${tutorId}:${day}`) || [];
      availability[day] = slots;
    }

    return c.json({ availability });

  } catch (error: any) {
    console.log(`Get availability error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Update availability (tutor only)
app.put("/make-server-9ffbf00b/tutors/availability", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'tutor') {
      return c.json({ error: "Only tutors can update availability" }, 403);
    }

    const { day, slots } = await c.req.json();
    await kv.set(`availability:${user.id}:${day}`, slots);

    return c.json({ success: true });

  } catch (error: any) {
    console.log(`Update availability error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== REQUEST ROUTES ==========

// Create tutoring request
app.post("/make-server-9ffbf00b/requests", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { tutorId, subject, date, time, message } = await c.req.json();
    
    const requestId = generateId();
    const request = {
      id: requestId,
      studentId: user.id,
      tutorId,
      subject,
      date,
      time,
      message,
      status: 'pending', // pending, accepted, rejected, completed, cancelled
      createdAt: new Date().toISOString(),
      confirmedByStudent: false,
      confirmedByTutor: false
    };

    await kv.set(`request:${requestId}`, request);

    // Add to student's requests
    const studentRequests = await kv.get(`requests:student:${user.id}`) || [];
    studentRequests.push(requestId);
    await kv.set(`requests:student:${user.id}`, studentRequests);

    // Add to tutor's requests
    const tutorRequests = await kv.get(`requests:tutor:${tutorId}`) || [];
    tutorRequests.push(requestId);
    await kv.set(`requests:tutor:${tutorId}`, tutorRequests);

    // Create notification for tutor
    await createNotification(tutorId, 'Nueva Solicitud', `Tienes una nueva solicitud de tutoría para ${subject}`);

    return c.json({ success: true, requestId });

  } catch (error: any) {
    console.log(`Create request error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's requests
app.get("/make-server-9ffbf00b/requests", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    const prefix = profile.role === 'tutor' ? `requests:tutor:${user.id}` : `requests:student:${user.id}`;
    const requestIds = await kv.get(prefix) || [];
    
    const requests = [];
    for (const reqId of requestIds) {
      const req = await kv.get(`request:${reqId}`);
      if (req) {
        // Add student and tutor names
        const student = await kv.get(`user:${req.studentId}`);
        const tutor = await kv.get(`user:${req.tutorId}`);
        requests.push({
          ...req,
          studentName: student?.name,
          tutorName: tutor?.name
        });
      }
    }

    return c.json({ requests });

  } catch (error: any) {
    console.log(`Get requests error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Update request status (accept/reject/cancel)
app.put("/make-server-9ffbf00b/requests/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const requestId = c.req.param('id');
    const { status, confirmedByStudent, confirmedByTutor } = await c.req.json();
    
    const request = await kv.get(`request:${requestId}`);
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Update request
    if (status) request.status = status;
    if (confirmedByStudent !== undefined) request.confirmedByStudent = confirmedByStudent;
    if (confirmedByTutor !== undefined) request.confirmedByTutor = confirmedByTutor;

    // If both confirmed, mark as completed
    if (request.confirmedByStudent && request.confirmedByTutor && request.status === 'accepted') {
      request.status = 'completed';
    }

    await kv.set(`request:${requestId}`, request);

    // Create notifications
    if (status === 'accepted') {
      await createNotification(request.studentId, 'Solicitud Aceptada', `Tu solicitud de tutoría ha sido aceptada`);
    } else if (status === 'rejected') {
      await createNotification(request.studentId, 'Solicitud Rechazada', `Tu solicitud de tutoría ha sido rechazada`);
    } else if (status === 'cancelled') {
      const otherUserId = user.id === request.studentId ? request.tutorId : request.studentId;
      await createNotification(otherUserId, 'Tutoría Cancelada', `Una tutoría ha sido cancelada`);
    }

    return c.json({ success: true, request });

  } catch (error: any) {
    console.log(`Update request error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== REVIEW ROUTES ==========

// Create review
app.post("/make-server-9ffbf00b/reviews", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { tutorId, studentId, rating, comment, requestId } = await c.req.json();
    
    const reviewId = generateId();
    const review = {
      id: reviewId,
      tutorId,
      studentId,
      rating,
      comment,
      requestId,
      approved: false, // Needs admin approval
      createdAt: new Date().toISOString(),
      reviewerId: user.id
    };

    await kv.set(`review:${reviewId}`, review);

    // Add to pending reviews
    const pendingReviews = await kv.get('reviews:pending') || [];
    pendingReviews.push(reviewId);
    await kv.set('reviews:pending', pendingReviews);

    return c.json({ success: true, reviewId });

  } catch (error: any) {
    console.log(`Create review error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get reviews for tutor
app.get("/make-server-9ffbf00b/reviews/tutor/:tutorId", async (c) => {
  try {
    const tutorId = c.req.param('tutorId');
    const allReviews = await kv.getByPrefix('review:');
    // Only show reviews where students reviewed the tutor (reviewerId === studentId)
    const tutorReviews = allReviews
      .filter(r => r.tutorId === tutorId && r.reviewerId === r.studentId && r.approved);

    return c.json({ reviews: tutorReviews });

  } catch (error: any) {
    console.log(`Get reviews error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get reviews for student
app.get("/make-server-9ffbf00b/reviews/student/:studentId", async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const allReviews = await kv.getByPrefix('review:');
    // Only show reviews where tutors reviewed the student (reviewerId === tutorId)
    const studentReviews = allReviews
      .filter(r => r.studentId === studentId && r.reviewerId === r.tutorId && r.approved);

    return c.json({ reviews: studentReviews });

  } catch (error: any) {
    console.log(`Get student reviews error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get student profile (for tutors to see when receiving request)
app.get("/make-server-9ffbf00b/students/:id", async (c) => {
  try {
    const studentId = c.req.param('id');
    const profile = await kv.get(`user:${studentId}`);
    
    if (!profile || profile.role !== 'student') {
      return c.json({ error: "Student not found" }, 404);
    }

    // Get student's reviews (given by tutors)
    // Only show reviews where tutors reviewed the student (reviewerId === tutorId)
    const allReviews = await kv.getByPrefix('review:');
    const studentReviews = allReviews
      .filter(r => r.studentId === studentId && r.reviewerId === r.tutorId && r.approved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ student: profile, reviews: studentReviews });

  } catch (error: any) {
    console.log(`Get student error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== NOTIFICATION ROUTES ==========

async function createNotification(userId: string, title: string, message: string) {
  const notifications = await kv.get(`notifications:${userId}`) || [];
  notifications.unshift({
    id: generateId(),
    title,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50);
  }
  
  await kv.set(`notifications:${userId}`, notifications);
}

app.get("/make-server-9ffbf00b/notifications", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notifications = await kv.get(`notifications:${user.id}`) || [];
    return c.json({ notifications });

  } catch (error: any) {
    console.log(`Get notifications error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-9ffbf00b/notifications/:id/read", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notifId = c.req.param('id');
    const notifications = await kv.get(`notifications:${user.id}`) || [];
    const notif = notifications.find((n: any) => n.id === notifId);
    
    if (notif) {
      notif.read = true;
      await kv.set(`notifications:${user.id}`, notifications);
    }

    return c.json({ success: true });

  } catch (error: any) {
    console.log(`Mark notification read error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// ========== ADMIN ROUTES ==========

// Get pending tutor applications
app.get("/make-server-9ffbf00b/admin/tutors/pending", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const pendingIds = await kv.get('tutors:pending') || [];
    const tutors = [];
    
    for (const tutorId of pendingIds) {
      const tutor = await kv.get(`user:${tutorId}`);
      if (tutor && !tutor.approved) {
        tutors.push(tutor);
      }
    }

    return c.json({ tutors });

  } catch (error: any) {
    console.log(`Get pending tutors error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Approve/reject tutor
app.put("/make-server-9ffbf00b/admin/tutors/:id/approve", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const tutorId = c.req.param('id');
    const { approved } = await c.req.json();
    
    const tutor = await kv.get(`user:${tutorId}`);
    if (!tutor) {
      return c.json({ error: "Tutor not found" }, 404);
    }

    tutor.approved = approved;
    await kv.set(`user:${tutorId}`, tutor);

    // Update lists
    const pending = await kv.get('tutors:pending') || [];
    const approvedList = await kv.get('tutors:approved') || [];

    if (approved) {
      const index = pending.indexOf(tutorId);
      if (index > -1) pending.splice(index, 1);
      if (!approvedList.includes(tutorId)) approvedList.push(tutorId);
      
      await createNotification(tutorId, 'Solicitud Aprobada', 'Tu solicitud para ser tutor ha sido aprobada');
    } else {
      const index = pending.indexOf(tutorId);
      if (index > -1) pending.splice(index, 1);
      
      await createNotification(tutorId, 'Solicitud Rechazada', 'Tu solicitud para ser tutor ha sido rechazada');
    }

    await kv.set('tutors:pending', pending);
    await kv.set('tutors:approved', approvedList);

    return c.json({ success: true });

  } catch (error: any) {
    console.log(`Approve tutor error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get pending reviews
app.get("/make-server-9ffbf00b/admin/reviews/pending", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const pendingIds = await kv.get('reviews:pending') || [];
    const reviews = [];
    
    for (const reviewId of pendingIds) {
      const review = await kv.get(`review:${reviewId}`);
      if (review && !review.approved) {
        const student = await kv.get(`user:${review.studentId}`);
        const tutor = await kv.get(`user:${review.tutorId}`);
        reviews.push({
          ...review,
          studentName: student?.name,
          tutorName: tutor?.name
        });
      }
    }

    return c.json({ reviews });

  } catch (error: any) {
    console.log(`Get pending reviews error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get approved reviews (for history)
app.get("/make-server-9ffbf00b/admin/reviews/approved", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    // Get all reviews by prefix
    const allReviews = await kv.getByPrefix('review:');
    const approvedReviews = [];
    
    for (const review of allReviews) {
      if (review.approved) {
        const student = await kv.get(`user:${review.studentId}`);
        const tutor = await kv.get(`user:${review.tutorId}`);
        approvedReviews.push({
          ...review,
          studentName: student?.name,
          tutorName: tutor?.name
        });
      }
    }

    // Sort by approval date (most recent first)
    approvedReviews.sort((a, b) => {
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return dateB - dateA;
    });

    return c.json({ reviews: approvedReviews });

  } catch (error: any) {
    console.log(`Get approved reviews error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Approve/delete review
app.put("/make-server-9ffbf00b/admin/reviews/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const reviewId = c.req.param('id');
    const { action } = await c.req.json(); // 'approve' or 'delete'
    
    const review = await kv.get(`review:${reviewId}`);
    if (!review) {
      return c.json({ error: "Review not found" }, 404);
    }

    const pending = await kv.get('reviews:pending') || [];
    const index = pending.indexOf(reviewId);
    if (index > -1) pending.splice(index, 1);

    if (action === 'approve') {
      review.approved = true;
      review.approvedAt = new Date().toISOString(); // Add approval timestamp
      await kv.set(`review:${reviewId}`, review);
      
      // Determine who is being reviewed (student or tutor)
      const student = await kv.get(`user:${review.studentId}`);
      const tutor = await kv.get(`user:${review.tutorId}`);
      
      // Check who left the review (reviewerId)
      if (review.reviewerId === review.studentId) {
        // Student reviewed tutor, update tutor rating
        if (tutor) {
          const totalRating = tutor.rating * tutor.reviewCount;
          tutor.reviewCount += 1;
          tutor.rating = (totalRating + review.rating) / tutor.reviewCount;
          await kv.set(`user:${review.tutorId}`, tutor);
        }
      } else if (review.reviewerId === review.tutorId) {
        // Tutor reviewed student, update student rating
        if (student) {
          const totalRating = student.rating * student.reviewCount;
          student.reviewCount += 1;
          student.rating = (totalRating + review.rating) / student.reviewCount;
          await kv.set(`user:${review.studentId}`, student);
        }
      }
    } else if (action === 'delete') {
      // If deleting an approved review, update rating for the reviewed person
      if (review.approved) {
        const student = await kv.get(`user:${review.studentId}`);
        const tutor = await kv.get(`user:${review.tutorId}`);
        
        if (review.reviewerId === review.studentId && tutor && tutor.reviewCount > 0) {
          // Student reviewed tutor, update tutor rating
          const totalRating = tutor.rating * tutor.reviewCount;
          tutor.reviewCount -= 1;
          if (tutor.reviewCount > 0) {
            tutor.rating = (totalRating - review.rating) / tutor.reviewCount;
          } else {
            tutor.rating = 0;
          }
          await kv.set(`user:${review.tutorId}`, tutor);
        } else if (review.reviewerId === review.tutorId && student && student.reviewCount > 0) {
          // Tutor reviewed student, update student rating
          const totalRating = student.rating * student.reviewCount;
          student.reviewCount -= 1;
          if (student.reviewCount > 0) {
            student.rating = (totalRating - review.rating) / student.reviewCount;
          } else {
            student.rating = 0;
          }
          await kv.set(`user:${review.studentId}`, student);
        }
      }
      await kv.del(`review:${reviewId}`);
    }

    await kv.set('reviews:pending', pending);

    return c.json({ success: true });

  } catch (error: any) {
    console.log(`Moderate review error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get all users (admin)
app.get("/make-server-9ffbf00b/admin/users", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const role = c.req.query('role'); // 'student' or 'tutor'
    const allUsers = await kv.getByPrefix('user:');
    
    const filteredUsers = role 
      ? allUsers.filter(u => u.role === role)
      : allUsers;

    return c.json({ users: filteredUsers });

  } catch (error: any) {
    console.log(`Get users error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Get user details with history (admin)
app.get("/make-server-9ffbf00b/admin/users/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (profile.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const targetUserId = c.req.param('id');
    const targetUser = await kv.get(`user:${targetUserId}`);
    
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get requests history
    const prefix = targetUser.role === 'tutor' 
      ? `requests:tutor:${targetUserId}` 
      : `requests:student:${targetUserId}`;
    const requestIds = await kv.get(prefix) || [];
    
    const requests = [];
    for (const reqId of requestIds) {
      const req = await kv.get(`request:${reqId}`);
      if (req) {
        const student = await kv.get(`user:${req.studentId}`);
        const tutor = await kv.get(`user:${req.tutorId}`);
        requests.push({
          ...req,
          studentName: student?.name,
          tutorName: tutor?.name
        });
      }
    }

    // Calculate stats if tutor
    let stats = null;
    if (targetUser.role === 'tutor') {
      const accepted = requests.filter(r => r.status === 'accepted').length;
      const completed = requests.filter(r => r.status === 'completed').length;
      stats = {
        acceptedCount: accepted,
        completedCount: completed,
        rating: targetUser.rating || 0,
        reviewCount: targetUser.reviewCount || 0
      };
    }

    return c.json({ 
      user: targetUser,
      requests,
      stats
    });

  } catch (error: any) {
    console.log(`Get user details error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);