export type Role = "ROLE_SUPER_ADMIN" | "ROLE_NGO_ADMIN" | "ROLE_VOLUNTEER";
export type NgoStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type VolunteerStatus = "PENDING_VERIFICATION" | "ACTIVE" | "INACTIVE";
export type EventType = "FLOOD" | "CYCLONE" | "EARTHQUAKE" | "FIRE" | "PANDEMIC" | "OTHER";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EventStatus = "DRAFT" | "OPEN" | "ONGOING" | "CLOSED" | "CANCELLED";
export type ShelterStatus = "OPEN" | "FULL" | "CLOSED";
export type InventoryCategory = "FOOD" | "WATER" | "MEDICAL" | "HYGIENE" | "CLOTHING" | "EQUIPMENT" | "OTHER";
export type DistributionStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

export interface Location { id: number; name: string; bnName?: string; parentId?: number | null; }

export interface PageResp<T> {
  content: T[];
  page: number; size: number; totalElements: number; totalPages: number;
  hasNext: boolean; hasPrevious: boolean;
}

export interface UserPrincipal {
  id: number; email: string; name: string; role: Role;
  ngoId?: number | null; ngoStatus?: string | null;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresInMs: number;
  principal: UserPrincipal;
}

export interface NgoResponse {
  id: number; name: string; email: string; registrationNo: string;
  logoUrl?: string; phone: string; website?: string;
  division?: Location; district?: Location; thana?: Location;
  status: NgoStatus; rejectionReason?: string; approvedAt?: string; createdAt?: string;
}

export interface VolunteerResponse {
  id: number; name: string; email: string; phone: string; nid?: string;
  dateOfBirth?: string; gender: Gender;
  division?: Location; district?: Location; thana?: Location;
  skills: string[]; status: VolunteerStatus;
}

export interface DisasterEventResponse {
  id: number; title: string; type: EventType; severity: Severity; description?: string;
  divisions: Location[]; districts: Location[]; thanas: Location[];
  startAt: string; endAt: string; requiredVolunteers: number;
  status: EventStatus; organizerId?: number | null; organizerName: string;
  organizerType: "NGO" | "VOLUNTEER" | "ADMIN" | "PLATFORM";
  participantCount: number; joinedByCurrentVolunteer: boolean;
  createdAt?: string;
}

export interface CertificateResponse {
  id: number; certificateNumber: string;
  eventId: number; eventTitle: string; eventType: EventType;
  volunteerId: number; volunteerName: string; organizerName: string;
  eventStartAt: string; eventEndAt: string; issuedAt: string;
}

export interface CertificateGenerationResponse {
  eventId: number; eventTitle: string; generated: number;
  alreadyIssued: number; participantCount: number;
}

export interface BulkUploadResponse {
  batchId: number; totalRows: number; successCount: number; failedCount: number;
  errors: { rowNumber: number; error: string }[];
}

export interface ShelterResponse {
  id: number; ngoId: number; ngoName: string; name: string; address: string;
  latitude: number; longitude: number; capacity: number; currentOccupancy: number;
  contactName: string; contactPhone: string; status: ShelterStatus;
  notes?: string; updatedAt?: string;
}

export interface InventoryItemResponse {
  id: number; ngoId: number; ngoName: string; shelterId?: number | null; shelterName?: string | null;
  name: string; category: InventoryCategory; quantity: number; unit: string;
  reorderLevel: number; lowStock: boolean; expiryDate?: string | null;
  notes?: string; updatedAt?: string;
}

export interface DistributionResponse {
  id: number; ngoId: number; ngoName: string; shelterId?: number | null; shelterName?: string | null;
  inventoryItemId: number; inventoryItemName: string; unit: string; recipientGroup: string;
  quantity: number; distributedAt: string; locationDescription: string;
  latitude?: number | null; longitude?: number | null; status: DistributionStatus;
  notes?: string; createdAt?: string;
}

export interface OperationsSummaryResponse {
  openShelters: number; availableBeds: number; inventoryItems: number;
  lowStockItems: number; completedDistributions: number; totalUnitsDistributed: number;
}
