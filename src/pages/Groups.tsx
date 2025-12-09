import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Group = { id: string; name: string; members?: string[] };

export default function Groups() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: getGroups,
    retry: 0,
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border p-4 bg-card">
        <h2 className="text-lg font-semibold">Groups</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading groups...</div>
        ) : isError ? (
          <div className="text-sm text-destructive">Failed to load groups</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-muted-foreground">No groups yet.</div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <Button key={g.id} variant="outline" className="w-full justify-start" onClick={() => navigate(`/app/group/${g.id}`)}>
                {g.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}