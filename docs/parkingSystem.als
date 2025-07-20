// ====================================================================
// Core Primitives & Enums 
// ====================================================================

// Represents a single point in time. We define a total ordering using 'next' and 'prev'.
abstract sig Time {
  next: lone Time, // Each time point has at most one successor
  prev: lone Time  // Each time point has at most one predecessor
} {
  no t: Time | t in t.^next // No cycles (no time point is reachable from itself via 'next')
  all t: Time | some t.next implies t.next.prev = t // Bidirectional link: if t has a next, that next's prev is t
  all t: Time | some t.prev implies t.prev.next = t // Bidirectional link: if t has a prev, that prev's next is t
  // Ensure there's a first and last time point (optional, but useful for bounded models)
  (some Time implies (one t: Time | no t.prev) and (one t: Time | no t.next))
}

// Define Boolean type for 'isAvailable' field
abstract sig Boolean {}
one sig True extends Boolean {}
one sig False extends Boolean {}

// User Roles
abstract sig Role {}
one sig USER_ROLE extends Role {}
one sig ADMIN_ROLE extends Role {}

// Vehicle Types
abstract sig VehicleType {}
one sig CAR extends VehicleType {}
one sig BIKE extends VehicleType {}
one sig TRUCK extends VehicleType {}

// Payment Status Types
abstract sig PaymentStatusType {}
one sig PENDING extends PaymentStatusType {}
one sig PAID extends PaymentStatusType {}
one sig FAILED extends PaymentStatusType {}
one sig REFUNDED extends PaymentStatusType {}

// Slot Types
abstract sig SlotType {}
one sig COMPACT extends SlotType {}
one sig REGULAR extends SlotType {}
one sig LARGE extends SlotType {}

// Slot Statuses
abstract sig SlotStatus {}
one sig AVAILABLE extends SlotStatus {}
one sig OCCUPIED extends SlotStatus {}
one sig RESERVED extends SlotStatus {}
one sig MAINTENANCE extends SlotStatus {}

// Session Statuses
abstract sig SessionStatus {}
one sig RESERVED_SESSION extends SessionStatus {} // Booked but not yet entered
one sig ACTIVE extends SessionStatus {}           // Vehicle is in the slot
one sig COMPLETED extends SessionStatus {}        // Session ended, vehicle left
one sig CANCELLED_SESSION extends SessionStatus {} // Session cancelled


// ====================================================================
// Models (Ordered by dependency)
// ====================================================================

// User Model
sig User {
  email: one String, // Unique email
  role: one Role     // User's role
}

// Vehicle Model
sig Vehicle {
  licensePlate: one String, // Unique license plate
  vehicleType: one VehicleType,
  owner: one User           // Reference to User
}

// Payment Status Model
sig PaymentStatus {
  status: one PaymentStatusType,
  date: lone Time, // Date when status was last updated
  transactionId: lone String // Optional transaction ID
}

// Parking Slot Model
sig ParkingSlot {
  slotId: one String, // Unique slot identifier
  parkingZone: one ParkingZone, // Reference to ParkingZone
  slotType: one SlotType,
  pricePerHour: one Int, // Using Int for simplicity, could be Real
  status: one SlotStatus, // Current status of the slot
  isAvailable: one Boolean, // Boolean flag (derived)
  reservedBy: lone User, // User who reserved it (optional)
  occupiedByVehicle: lone Vehicle // Vehicle occupying it (optional)
}

// Parking Zone Model
sig ParkingZone {
  zoneId: one String, // Unique identifier
  name: one String,
  address: one String,
  location_latitude: one Int, // Using Int for simplicity, could be Real for decimals
  location_longitude: one Int, // Using Int for simplicity
  description: lone String,
  totalSlots: one Int,     // Total slots in this zone
  availableSlots: one Int,  // Available slots in this zone (derived)
  slots: set ParkingSlot    // This now correctly references a defined ParkingSlot
}

// Parking Session Model
sig ParkingSession {
  entryTime: one Time,
  exitTime: one Time,       // Expected exit time
  actualExitTime: lone Time, // Actual exit time (optional)
  parkingSlot: one ParkingSlot, // Reference to ParkingSlot
  vehicle: one Vehicle,       // Reference to Vehicle
  user: one User,             // Reference to User
  status: one SessionStatus, // Current status of the session
  durationHours: one Int     // Calculated duration (derived)
}

// Log Model (Simplified for core verification)
sig Log {
  action: one String,
  userId: lone User, // User who performed the action (optional)
  timestamp: one Time,
  details: lone String // Simplified object to string
}

// Invoice Model
sig Invoice {
  amount: one Int, // Using Int for simplicity, could be Real
  user: one User,
  parkingSession: one ParkingSession, // Link to the specific parking session (unique)
  issueDate: one Time,
  dueDate: lone Time, // Optional: For future payment reminders
  paymentStatus: one PaymentStatus, // Reference to the PaymentStatus document
  description: lone String
}


// ====================================================================
// Step 3: Define Critical Constraints (Facts)
// ====================================================================

// Predicate to define 'less than' for Time
pred lt[t1, t2: Time] { t1 in t2.^prev }

// Predicate to define 'less than or equal to' for Time
pred lte[t1, t2: Time] { t1 = t2 or t1 in t2.^prev }

// Predicate to define 'overlaps' for time intervals [start1, end1] and [start2, end2]
pred overlaps[start1, end1, start2, end2: Time] {
  lt[start1, end2] and lt[start2, end1]
}

// Time consistency for all entities
fact TimeConsistency {
  all ps: ParkingSession | lt[ps.entryTime, ps.exitTime] // Entry before exit
  all i: Invoice | some i.issueDate // Issue date exists
  all ps: PaymentStatus | some ps.date implies some ps.date // Date exists if present
  all l: Log | some l.timestamp // Timestamp exists
}

// Fact to link ParkingZone.slots and ParkingSlot.parkingZone
fact SlotBelongsToZone {
  all s: ParkingSlot | s.parkingZone in ParkingZone // Every slot must belong to some zone
  all z: ParkingZone, s: ParkingSlot | (s in z.slots) iff (s.parkingZone = z)
}

// Parking Zone Constraints
fact ZoneCapacityConsistency {
  all z: ParkingZone |
    z.availableSlots >= 0 and z.totalSlots >= 0 and z.availableSlots <= z.totalSlots
  // totalSlots should be the count of slots associated with this zone
  all z: ParkingZone |
    z.totalSlots = #(z.slots)
}

// Parking Slot Constraints
fact SlotStatusConsistency {
  all s: ParkingSlot {
    // isAvailable must match status
    (s.status = AVAILABLE) implies (s.isAvailable = True)
    (s.status != AVAILABLE) implies (s.isAvailable = False)

    // reservedBy must be non-null if status is RESERVED
    (s.status = RESERVED) implies (some s.reservedBy)
    (s.status != RESERVED) implies (no s.reservedBy) // If not RESERVED, no one is reserving it

    // occupiedByVehicle must be non-null if status is OCCUPIED
    (s.status = OCCUPIED) implies (some s.occupiedByVehicle)
    (s.status != OCCUPIED) implies (no s.occupiedByVehicle) // If not OCCUPIED, no vehicle is in it
  }
}

// Parking Session Constraints
fact SessionTimeOrder {
  all ps: ParkingSession | lt[ps.entryTime, ps.exitTime] // Exit time must be strictly after entry time
  all ps: ParkingSession | some ps.actualExitTime implies lt[ps.entryTime, ps.actualExitTime] // Actual exit must be strictly after entry
}

// Parking Session - Slot Status Link
fact SessionSlotStatusLink {
  all ps: ParkingSession {
    (ps.status = RESERVED_SESSION) implies (ps.parkingSlot.status = RESERVED)
    (ps.status = ACTIVE) implies (ps.parkingSlot.status = OCCUPIED)
    (ps.status = COMPLETED) implies (ps.parkingSlot.status = AVAILABLE) // Slot becomes available after completion
    (ps.status = CANCELLED_SESSION) implies (ps.parkingSlot.status = AVAILABLE) // Slot becomes available after cancellation
  }
}

// No overlapping ACTIVE or RESERVED sessions for the same slot
fact noOverlappingSessions {
  all ps1, ps2: ParkingSession |
    (ps1 != ps2 and ps1.parkingSlot = ps2.parkingSlot) implies (
      // If sessions are for the same slot, their active/reserved periods must not overlap
      (ps1.status in (ACTIVE + RESERVED_SESSION) and ps2.status in (ACTIVE + RESERVED_SESSION)) implies
        (lte[ps1.exitTime, ps2.entryTime] or lte[ps2.exitTime, ps1.entryTime]) // One ends before or at the time the other begins
    )
}

// Invoice Constraints
fact InvoiceSessionLink {
  all i: Invoice {
    one i.parkingSession // Ensure one invoice per parking session (unique constraint from Mongoose)
    i.user = i.parkingSession.user // Invoice user must match session user
  }
}

// Payment Validation
fact PaymentValidation {
  all i: Invoice | i.paymentStatus.status = PAID implies {
    // If an invoice is PAID, its associated session must eventually be completed
    i.parkingSession.status = COMPLETED
  }
  all i: Invoice | i.paymentStatus.status = PENDING implies {
    // If an invoice is PENDING, its associated session should be RESERVED or ACTIVE
    i.parkingSession.status in (RESERVED_SESSION + ACTIVE)
  }
}

// ====================================================================
// Step 4: Formulate "What If?" Questions (Assertions) and Test
// ====================================================================

// Assertion 1: A slot cannot be simultaneously reserved by two different users.
assert singleReservationPerSlot {
  all s: ParkingSlot |
    #({u: User | s.reservedBy = u}) <= 1
}

// Assertion 2: A slot cannot be simultaneously occupied by two different vehicles.
assert singleOccupancyPerSlot {
  all s: ParkingSlot |
    #({v: Vehicle | s.occupiedByVehicle = v}) <= 1
}

// Assertion 3: If a parking session is ACTIVE, its slot must be OCCUPIED.
assert activeSessionImpliesOccupiedSlot {
  all ps: ParkingSession | ps.status = ACTIVE implies ps.parkingSlot.status = OCCUPIED
}

// Assertion 4: If a parking session is COMPLETED, its slot must be AVAILABLE.
assert completedSessionImpliesAvailableSlot {
  all ps: ParkingSession | ps.status = COMPLETED implies ps.parkingSlot.status = AVAILABLE
}

// Assertion 5: A user cannot book two different slots that overlap in time.
assert userCannotDoubleBook {
  all u: User, ps1, ps2: ParkingSession |
    (ps1 != ps2 and ps1.user = u and ps2.user = u) implies (
      overlaps[ps1.entryTime, ps1.exitTime, ps2.entryTime, ps2.exitTime] implies
        (ps1.parkingSlot != ps2.parkingSlot)
    )
}

// Assertion 6: An invoice with 'PAID' status always has a payment date.
assert paidInvoiceHasPaymentDate {
  all i: Invoice | i.paymentStatus.status = PAID implies some i.paymentStatus.date
}

// Assertion 7: The available slots in a zone are correctly calculated based on its total slots and occupied/reserved slots.
assert availableSlotsCalculation {
  all z: ParkingZone |
    z.availableSlots = z.totalSlots - #({s: ParkingSlot | s in z.slots and (s.status = OCCUPIED or s.status = RESERVED)})
}

// ====================================================================
// 5. Commands (Run & Check) - These are what you execute in the Analyzer
// ====================================================================

// Run to generate a valid instance of the system
run {
  some ps: ParkingSession | ps.status = ACTIVE
} for 3 User, 2 Vehicle, 2 ParkingZone, 5 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log


// Commands to check assertions
// Check Command 1: Ensure no multiple reservations per slot
check singleReservationPerSlot for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 2: Ensure no multiple occupancy per slot
check singleOccupancyPerSlot for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 3: If a parking session is ACTIVE, its slot must be OCCUPIED
check activeSessionImpliesOccupiedSlot for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 4: If a parking session is COMPLETED, its slot must be AVAILABLE
check completedSessionImpliesAvailableSlot for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 5: Ensure a user cannot book two different slots that overlap in time
check userCannotDoubleBook for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 6: Ensure an invoice with 'PAID' status always has a payment date
check paidInvoiceHasPaymentDate for 3 User, 2 Vehicle, 2 ParkingZone, 2 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log

// Check Command 7: Available slots in a zone should match the total slots minus reserved/occupied slots
check availableSlotsCalculation for 3 User, 2 Vehicle, 2 ParkingZone, 5 ParkingSlot, 3 ParkingSession, 3 Invoice, 3 PaymentStatus, 5 Time, 2 Log
