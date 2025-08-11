'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Loader2, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobFilterForm {
  file: File | null;
  departments: string[];
  jobTitles: string[];
  includeCareerPages: boolean;
  fuzzyMatching: boolean;
  confidenceThreshold: number;
}

const AVAILABLE_DEPARTMENTS = [
  'Sales',
  'Engineering', 
  'Product',
  'Marketing',
  'Operations',
  'Customer Support',
  'Human Resources',
  'Finance',
  'Legal'
];

export default function LinkedInJobFilterPage() {
  const [form, setForm] = useState<JobFilterForm>({
    file: null,
    departments: [],
    jobTitles: [],
    includeCareerPages: false,
    fuzzyMatching: true,
    confidenceThreshold: 0.7
  });
  
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setForm(prev => ({ ...prev, file }));
    }
  };

  const handleDepartmentToggle = (department: string) => {
    setForm(prev => ({
      ...prev,
      departments: prev.departments.includes(department)
        ? prev.departments.filter(d => d !== department)
        : [...prev.departments, department]
    }));
  };

  const addJobTitle = () => {
    if (jobTitleInput.trim() && !form.jobTitles.includes(jobTitleInput.trim())) {
      setForm(prev => ({
        ...prev,
        jobTitles: [...prev.jobTitles, jobTitleInput.trim()]
      }));
      setJobTitleInput('');
    }
  };

  const removeJobTitle = (title: string) => {
    setForm(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.filter(t => t !== title)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!form.file) {
      toast({
        title: "File Required",
        description: "Please select a CSV file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    if (form.departments.length === 0) {
      toast({
        title: "Departments Required", 
        description: "Please select at least one department.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', form.file);
      formData.append('departments', JSON.stringify(form.departments));
      
      if (form.jobTitles.length > 0) {
        formData.append('jobTitles', JSON.stringify(form.jobTitles));
      }
      
      formData.append('includeCareerPages', form.includeCareerPages.toString());
      formData.append('fuzzyMatching', form.fuzzyMatching.toString());
      formData.append('confidenceThreshold', form.confidenceThreshold.toString());

      console.log('📤 Sending request to /api/linkedin-job-filter');
      console.log('📤 Form data entries:', Array.from(formData.entries()));
      
      const response = await fetch('/api/linkedin-job-filter', {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response received:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const result = await response.json();
      console.log('📥 Response data:', result);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || result.message || response.statusText}`);
      }
      
      if (result.jobId) {
        setJobId(result.jobId);
        setProcessing(true);
        toast({
          title: "Processing Started",
          description: `Job ${result.jobId} is now processing your CSV file.`
        });
        
        // Start polling for status
        pollJobStatus(result.jobId);
      } else {
        throw new Error(result.error || 'No job ID returned');
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      toast({
        title: "Upload Failed", 
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/linkedin-job-filter/${jobId}/status`);
      const status = await response.json();
      
      if (status.status === 'completed') {
        setProcessing(false);
        toast({
          title: "Processing Complete!",
          description: "Your job filtering results are ready for download."
        });
        
        // Fetch results
        const resultsResponse = await fetch(`/api/linkedin-job-filter/${jobId}/results`);
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
        
      } else if (status.status === 'failed') {
        setProcessing(false);
        toast({
          title: "Processing Failed",
          description: status.errorMessage || "An error occurred during processing.",
          variant: "destructive"
        });
      } else {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 3000);
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setTimeout(() => pollJobStatus(jobId), 5000); // Retry after longer delay
    }
  };

  const downloadResults = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/linkedin-job-filter/${jobId}/results?format=csv`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `linkedin-job-filter-results-${jobId}.csv`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your results CSV file is downloading."
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unable to download results file.",
        variant: "destructive"
      });
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['LinkedIn URL', 'Domain', 'Name', 'Description'],
      ['https://www.linkedin.com/company/google', 'google.com', 'Google', 'Technology company'],
      ['https://www.linkedin.com/company/microsoft', 'microsoft.com', 'Microsoft', 'Software company'],
      ['https://www.linkedin.com/company/apple', 'apple.com', 'Apple', 'Technology company'],
      ['https://www.linkedin.com/company/amazon', 'amazon.com', 'Amazon', 'E-commerce company'],
      ['https://www.linkedin.com/company/salesforce', 'salesforce.com', 'Salesforce', 'CRM software company']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-companies.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Sample CSV Downloaded",
      description: "Use this format for your company data upload."
    });
  };

  const resetForm = () => {
    setForm({
      file: null,
      departments: [],
      jobTitles: [],
      includeCareerPages: false,
      fuzzyMatching: true,
      confidenceThreshold: 0.7
    });
    setJobId(null);
    setProcessing(false);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (processing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing Job Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Job ID: <code className="px-2 py-1 bg-muted rounded">{jobId}</code>
              </p>
              <p>We're analyzing your CSV file and scraping job data from LinkedIn and company career pages. This may take several minutes...</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Job Filter Results
              </span>
              <div className="flex gap-2">
                <Button onClick={downloadResults} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  New Filter
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary?.totalCompanies || 0}</div>
                    <p className="text-muted-foreground">Total Companies</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary?.companiesWithJobs || 0}</div>
                    <p className="text-muted-foreground">Successfully Processed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(results.summary?.totalCompanies || 0) - (results.summary?.companiesWithJobs || 0)}</div>
                    <p className="text-muted-foreground">Failed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-muted-foreground text-center mb-6">
              Your enhanced CSV file with job match counts has been generated and is ready for download.
            </p>

            {/* Detailed Results Table */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Company Results Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">LinkedIn URL</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Jobs Found</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Department</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.results?.map((company: any, index: number) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{company.companyName}</div>
                              {company.companyWebsite && (
                                <div className="text-sm text-muted-foreground">
                                  <a 
                                    href={`https://${company.companyWebsite}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    {company.companyWebsite}
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <a 
                              href={company.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View LinkedIn →
                            </a>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                              company.matchCount > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {company.matchCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {company.department}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              company.processingStatus === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {company.processingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">LinkedIn Job Profile Scanner</h1>
          <p className="text-muted-foreground mb-4">
            Upload a CSV file with LinkedIn company URLs to scan and count job profiles by department or specific titles.
          </p>
          <Button 
            variant="outline" 
            onClick={downloadSampleCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Sample CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload & Configure</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">CSV File *</Label>
                <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {form.file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">{form.file.name}</span>
                        <Badge variant="secondary">
                          {(form.file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm(prev => ({ ...prev, file: null }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CSV files only, max 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Required columns: "LinkedIn URL", "Company Website". Optional: "Company Name"
                </p>
              </div>

              {/* Departments */}
              <div className="space-y-2">
                <Label>Departments to Search *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_DEPARTMENTS.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={form.departments.includes(dept)}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <Label htmlFor={dept} className="text-sm font-normal">
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Titles */}
              <div className="space-y-2">
                <Label>Specific Job Titles (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Sales Manager, Software Engineer"
                    value={jobTitleInput}
                    onChange={(e) => setJobTitleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobTitle())}
                  />
                  <Button type="button" onClick={addJobTitle} disabled={!jobTitleInput.trim()}>
                    Add
                  </Button>
                </div>
                {form.jobTitles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.jobTitles.map((title) => (
                      <Badge key={title} variant="secondary" className="flex items-center gap-1">
                        {title}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeJobTitle(title)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <Label>Advanced Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-career"
                    checked={form.includeCareerPages}
                    onCheckedChange={(checked) => 
                      setForm(prev => ({ ...prev, includeCareerPages: checked as boolean }))
                    }
                  />
                  <Label htmlFor="include-career" className="text-sm font-normal">
                    Include company career pages (slower but more comprehensive)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fuzzy-matching"
                    checked={form.fuzzyMatching}
                    onCheckedChange={(checked) => 
                      setForm(prev => ({ ...prev, fuzzyMatching: checked as boolean }))
                    }
                  />
                  <Label htmlFor="fuzzy-matching" className="text-sm font-normal">
                    Enable fuzzy matching for similar job titles
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">
                    Confidence Threshold: {form.confidenceThreshold}
                  </Label>
                  <Input
                    id="confidence-threshold"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={form.confidenceThreshold}
                    onChange={(e) => 
                      setForm(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values require more exact matches
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !form.file || form.departments.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  'Start Job Profile Scanning'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}