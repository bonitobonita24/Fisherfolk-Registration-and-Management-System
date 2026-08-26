'use client'

// Third-party Imports
import { toast } from 'sonner'
import { differenceInCalendarDays, format } from 'date-fns'
import { DownloadIcon } from 'lucide-react'

// Type Imports
import type { ComplianceDocType, Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ComplianceDocumentsCardProps = {
  vehicle: Vehicle
}

const AS_OF = new Date('2026-05-22')

const DOC_TYPE_LABEL: Record<ComplianceDocType, string> = {
  insurance: 'Insurance',
  registration: 'Registration',
  inspection: 'Inspection',
  permit: 'Permit',
  emissions: 'Emissions'
}

const toValidDate = (value?: string) => {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const getDocStatus = (expiry: string) => {
  const date = toValidDate(expiry)

  if (!date) return { label: 'No expiry', className: 'bg-muted text-muted-foreground' }

  const days = differenceInCalendarDays(date, AS_OF)

  if (days < 0) return { label: 'Expired', className: 'bg-destructive/10 text-destructive' }
  if (days <= 30) return { label: 'Expiring', className: 'bg-warning-soft text-warning' }

  return { label: 'Valid', className: 'bg-success-soft text-success' }
}

const formatDate = (value?: string) => {
  const date = toValidDate(value)

  return date ? format(date, 'dd MMM yyyy') : '—'
}

const ComplianceDocumentsCard = ({ vehicle }: ComplianceDocumentsCardProps) => {
  // Vars
  const docs = vehicle.complianceDocs ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Document No.</TableHead>
                <TableHead>Issued On</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='w-12 text-right'>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground py-6 text-center text-sm'>
                    No compliance documents on file.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map(doc => {
                  const status = getDocStatus(doc.expiry)

                  return (
                    <TableRow key={`${doc.type}-${doc.number}`}>
                      <TableCell className='font-medium'>{DOC_TYPE_LABEL[doc.type]}</TableCell>
                      <TableCell className='text-muted-foreground'>{doc.number}</TableCell>
                      <TableCell className='whitespace-nowrap'>{formatDate(doc.issuedOn)}</TableCell>
                      <TableCell className='whitespace-nowrap'>{formatDate(doc.expiry)}</TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={`Download ${DOC_TYPE_LABEL[doc.type]} document`}
                          onClick={() => toast('Download coming soon')}
                        >
                          <DownloadIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ComplianceDocumentsCard
