const StockLedgerPageHeader = () => {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Stock Ledger</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Every stock movement across your warehouses, with a running per-warehouse balance.
        </p>
      </div>
    </div>
  )
}

export default StockLedgerPageHeader
