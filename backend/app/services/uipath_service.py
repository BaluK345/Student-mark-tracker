import aiohttp
import asyncio
import logging
import json
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class UiPathOrchestratorClient:
    """Client for interacting with UiPath Orchestrator API using PAT authentication."""
    
    def __init__(
        self,
        orchestrator_url: str,
        pat_token: str,
        folder_id: str,
        process_name: str = None
    ):
        """
        Initialize UiPath client with PAT token authentication.
        
        Args:
            orchestrator_url: Full orchestrator URL (e.g., https://cloud.uipath.com/baluayrkmcc/DefaultTenant/orchestrator_)
            pat_token: Personal Access Token from Preferences → Personal Access Tokens
            folder_id: Folder/Organization Unit ID
            process_name: Name of the published process
        """
        self.orchestrator_url = orchestrator_url.rstrip("/")
        self.pat_token = pat_token
        self.folder_id = folder_id
        self.process_name = process_name
        self.release_key: Optional[str] = None

    async def get_release_key(self) -> Optional[str]:
        """Get the Release Key for the published process."""
        try:
            if self.release_key:
                return self.release_key
            
            url = f"{self.orchestrator_url}/odata/Releases"
            
            headers = {
                "Authorization": f"Bearer {self.pat_token}",
                "Content-Type": "application/json",
                "X-UIPATH-OrganizationUnitId": self.folder_id
            }
            
            params = {"$filter": f"Name eq '{self.process_name}'"}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    headers=headers,
                    params=params
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("value") and len(data["value"]) > 0:
                            self.release_key = data["value"][0].get("Key")
                            logger.info(f"Release Key obtained: {self.release_key}")
                            return self.release_key
                        else:
                            logger.error(f"Process '{self.process_name}' not found in Orchestrator")
                            return None
                    else:
                        error_text = await response.text()
                        logger.error(f"Error getting release key: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Error getting release key: {str(e)}")
            return None

    async def start_job(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        student_name: Optional[str] = None,
        roll_number: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Start a UiPath job with input arguments using modern Jobs endpoint."""
        try:
            # Get release key
            release_key = await self.get_release_key()
            if not release_key:
                logger.error("Cannot start job: Release key not found")
                return None
            
            # Prepare input arguments
            input_arguments = {
                "RecipientEmail": recipient_email,
                "Subject": subject,
                "Body": body,
            }
            
            if student_name:
                input_arguments["StudentName"] = student_name
            if roll_number:
                input_arguments["RollNumber"] = roll_number
            
            # Create job
            url = f"{self.orchestrator_url}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs"
            
            headers = {
                "Authorization": f"Bearer {self.pat_token}",
                "Content-Type": "application/json",
                "X-UIPATH-OrganizationUnitId": self.folder_id
            }
            
            payload = {
                "startInfo": {
                    "ReleaseKey": release_key,
                    "Strategy": "ModernJobsCount",
                    "JobsCount": 1,
                    "RuntimeType": "Unattended",
                    "InputArguments": json.dumps(input_arguments)
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 201:
                        data = await response.json()
                        job_id = data.get("value", [{}])[0].get("Id")
                        logger.info(f"Job started successfully: {job_id}")
                        return {
                            "Id": job_id,
                            "Status": "Running",
                            "Message": f"Email job created for {recipient_email}"
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"Error starting job: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Error starting job: {str(e)}")
            return None

    async def send_email_job(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        student_name: Optional[str] = None,
        roll_number: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Start a job to send email via UiPath robot.
        Uses start_job method internally.
        """
        return await self.start_job(
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            student_name=student_name,
            roll_number=roll_number
        )

    async def check_job_status(self, job_id: str) -> Optional[str]:
        """Check job status in UiPath Orchestrator."""
        try:
            url = f"{self.orchestrator_url}/odata/Jobs({job_id})"
            
            headers = {
                "Authorization": f"Bearer {self.pat_token}",
                "Content-Type": "application/json",
                "X-UIPATH-OrganizationUnitId": self.folder_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("State")
                    return None
        except Exception as e:
            logger.error(f"Error checking job status: {str(e)}")
            return None
