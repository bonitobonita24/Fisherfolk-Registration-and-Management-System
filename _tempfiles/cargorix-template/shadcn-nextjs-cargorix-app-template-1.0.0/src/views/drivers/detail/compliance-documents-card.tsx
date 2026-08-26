'use client'

// Third-party Imports
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DownloadIcon } from 'lucide-react'

// Type Imports
import type { LicenseSeverity } from '@/lib/selectors/drivers-selectors'
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { getLicenseSeverity } from '@/lib/selectors/drivers-selectors'

// Data Imports
import { DOC_TYPE_LABEL } from '../driver-badges'

type ComplianceDocumentsCardProps = {
  driver: Driver
}

const STATUS_BADGE: Record<LicenseSeverity, { label: string; className: string }> = {
  valid: { label: 'Valid', className: 'bg-success-soft text-success' },
  expiring: { label: 'Expiring', className: 'bg-warning-soft text-warning' },
  expired: { label: 'Expired', className: 'bg-destructive/10 text-destructive' }
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const ComplianceDocumentsCard = ({ driver }: ComplianceDocumentsCardProps) => {
  // Vars
  const docs = driver.documents ?? []

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <CardTitle>Compliance Documents</CardTitle>
        <Button variant='link' size='sm' className='h-auto p-0' onClick={() => toast('Documents coming soon')}>
          View all documents
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Document No.</TableHead>
                <TableHead>Issue Date</TableHead>
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
                  const status = STATUS_BADGE[getLicenseSeverity(doc.expiry)]

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
