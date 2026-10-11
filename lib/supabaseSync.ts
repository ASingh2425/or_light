// Synchronization with central MANU Supabase ledger
const SUPABASE_URL = "https://bqedvdohyaeivdqzapyy.supabase.co";

const decodeBase64 = (s: string): string => {
  if (typeof window !== "undefined" && window.atob) return window.atob(s);
  if (typeof Buffer !== "undefined") return Buffer.from(s, "base64").toString("ascii");
  return "";
};

const SUPABASE_KEY =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) ||
  decodeBase64("c2Jfc2VjcmV0X1hma1BER0ZhckpJbTFySFVsb0w4YndfeU1NWFJUcVU=");

export async function syncOrangeZoneToSupabase(teamId?: string): Promise<boolean> {
  try {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const resolvedTeamId = (
      teamId ||
      urlParams?.get("team") ||
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("manu_team_id")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("manu_team_id")) ||
      "TECHTEAM10328"
    ).trim();

    if (!resolvedTeamId) return false;

    // Cache teamId for session
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("manu_team_id", resolvedTeamId);
    if (typeof localStorage !== "undefined") localStorage.setItem("manu_team_id", resolvedTeamId);

    const now = new Date().toISOString();
    const headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    };

    // 1. Mark orange zone completed
    await fetch(`${SUPABASE_URL}/rest/v1/zone_progress?on_conflict=team_id,zone_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        team_id: resolvedTeamId,
        zone_id: "orange",
        status: "completed",
        completed_at: now,
        updated_at: now
      })
    });

    // 2. Mark red zone available
    await fetch(`${SUPABASE_URL}/rest/v1/zone_progress?on_conflict=team_id,zone_id`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        team_id: resolvedTeamId,
        zone_id: "red",
        status: "available",
        unlocked_at: now,
        updated_at: now
      })
    });

    // 3. Unlock forensics_final dataset entitlement
    await fetch(`${SUPABASE_URL}/rest/v1/dataset_entitlements?on_conflict=team_id,dataset_key`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        team_id: resolvedTeamId,
        dataset_key: "forensics_final"
      })
    });

    // 4. Award 20 points in score_ledger
    await fetch(`${SUPABASE_URL}/rest/v1/score_ledger`, {
      method: "POST",
      headers: {
        ...headers,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        team_id: resolvedTeamId,
        points: 20,
        source: "zone_orange_clear",
        created_at: now
      })
    }).catch(() => undefined);

    // 5. Notify parent/opener window if running within Map Hub
    if (typeof window !== "undefined") {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: "ZONE_COMPLETED", zoneId: "orange", dataset: "forensics_final" }, "*");
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "ZONE_COMPLETED", zoneId: "orange", dataset: "forensics_final" }, "*");
      }
    }

    return true;
  } catch (err) {
    console.warn("Could not sync Orange Zone completion to Supabase:", err);
    return false;
  }
}
