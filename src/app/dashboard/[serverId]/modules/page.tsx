'use client';

import { redirect, useParams } from "next/navigation";

export default function ModulesPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    // Redirect to a default page within the server dashboard
    redirect(`/dashboard/${serverId}`);
}
