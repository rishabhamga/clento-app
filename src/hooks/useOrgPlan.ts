import { useOrganization } from "@clerk/nextjs";
import { useCallback } from "react";

export interface orgPlanOutput {
  hasPlan: boolean;
}

interface ResponseType {
    success: boolean,
    plan: boolean
}

import { useState, useEffect } from "react";

export function useOrgPlan(): orgPlanOutput {
    const { organization } = useOrganization();
    const [hasPlan, setHasPlan] = useState<boolean>(false);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const response = await fetch(`/api/organizations/plan`);
                if (!response.ok) {
                    setHasPlan(false);
                    return;
                }
                const result: ResponseType = await response.json();
                setHasPlan(result.plan);
            } catch (err) {
                setHasPlan(false);
            }
        }
        if (organization?.id) {
            fetchPlan();
        }
    }, [organization?.id]);

    return {
        hasPlan
    };
}