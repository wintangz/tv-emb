import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EmbroideryService } from './embroidery.service.js';
import type {
  Customer,
  DashboardPayload,
  EmbroideryDatabase,
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  InventoryItem,
  OrderStatus,
  QuoteBreakdown,
  QuoteInput,
} from './embroidery.types.js';

@Controller('api')
export class EmbroideryController {
  constructor(private readonly embroideryService: EmbroideryService) {}

  @Get('dashboard')
  getDashboard(): DashboardPayload {
    return this.embroideryService.getDashboard();
  }

  @Post('reset')
  resetDatabase(): DashboardPayload {
    return this.embroideryService.resetDatabase();
  }

  @Post('import')
  importDatabase(
    @Body() body: Partial<EmbroideryDatabase>,
  ): DashboardPayload {
    return this.embroideryService.importDatabase(body);
  }

  @Get('orders')
  getOrders(): EmbroideryOrder[] {
    return this.embroideryService.getOrders();
  }

  @Post('orders')
  createOrder(@Body() body: Partial<EmbroideryOrder>): EmbroideryOrder {
    return this.embroideryService.createOrder(body);
  }

  @Patch('orders/:id')
  updateOrder(
    @Param('id') id: string,
    @Body() body: Partial<EmbroideryOrder>,
  ): EmbroideryOrder {
    return this.embroideryService.updateOrder(id, body);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: OrderStatus;
      completedQuantity?: number;
      assignedMachineId?: string | null;
    },
  ): EmbroideryOrder {
    return this.embroideryService.updateOrderStatus(
      id,
      body.status,
      body.completedQuantity,
      body.assignedMachineId,
    );
  }

  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.embroideryService.deleteOrder(id);
  }

  @Get('designs')
  getDesigns(): EmbroideryDesign[] {
    return this.embroideryService.getDesigns();
  }

  @Post('designs')
  createDesign(@Body() body: Partial<EmbroideryDesign>): EmbroideryDesign {
    return this.embroideryService.createDesign(body);
  }

  @Patch('designs/:id')
  updateDesign(
    @Param('id') id: string,
    @Body() body: Partial<EmbroideryDesign>,
  ): EmbroideryDesign {
    return this.embroideryService.updateDesign(id, body);
  }

  @Delete('designs/:id')
  deleteDesign(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.embroideryService.deleteDesign(id);
  }

  @Get('machines')
  getMachines(): EmbroideryMachine[] {
    return this.embroideryService.getMachines();
  }

  @Post('machines')
  createMachine(@Body() body: Partial<EmbroideryMachine>): EmbroideryMachine {
    return this.embroideryService.createMachine(body);
  }

  @Patch('machines/:id')
  updateMachine(
    @Param('id') id: string,
    @Body() body: Partial<EmbroideryMachine>,
  ): EmbroideryMachine {
    return this.embroideryService.updateMachine(id, body);
  }

  @Get('inventory')
  getInventory(): InventoryItem[] {
    return this.embroideryService.getInventory();
  }

  @Post('inventory')
  createInventoryItem(@Body() body: Partial<InventoryItem>): InventoryItem {
    return this.embroideryService.createInventoryItem(body);
  }

  @Post('inventory/restock-low')
  restockLowInventory(): InventoryItem[] {
    return this.embroideryService.restockLowInventory();
  }

  @Patch('inventory/:id')
  updateInventoryItem(
    @Param('id') id: string,
    @Body() body: Partial<InventoryItem>,
  ): InventoryItem {
    return this.embroideryService.updateInventoryItem(id, body);
  }

  @Patch('inventory/:id/stock')
  adjustInventoryStock(
    @Param('id') id: string,
    @Body() body: { delta: number },
  ): InventoryItem {
    return this.embroideryService.adjustInventoryStock(id, body.delta);
  }

  @Delete('inventory/:id')
  deleteInventoryItem(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.embroideryService.deleteInventoryItem(id);
  }

  @Get('customers')
  getCustomers(): Customer[] {
    return this.embroideryService.getCustomers();
  }

  @Post('customers')
  createCustomer(@Body() body: Partial<Customer>): Customer {
    return this.embroideryService.createCustomer(body);
  }

  @Patch('customers/:id')
  updateCustomer(
    @Param('id') id: string,
    @Body() body: Partial<Customer>,
  ): Customer {
    return this.embroideryService.updateCustomer(id, body);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.embroideryService.deleteCustomer(id);
  }

  @Get('employees')
  getEmployees(): Employee[] {
    return this.embroideryService.getEmployees();
  }

  @Post('employees')
  createEmployee(@Body() body: Partial<Employee>): Employee {
    return this.embroideryService.createEmployee(body);
  }

  @Patch('employees/:id')
  updateEmployee(
    @Param('id') id: string,
    @Body() body: Partial<Employee>,
  ): Employee {
    return this.embroideryService.updateEmployee(id, body);
  }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.embroideryService.deleteEmployee(id);
  }

  @Post('quote/calculate')
  calculateQuote(@Body() body: Partial<QuoteInput>): QuoteBreakdown {
    return this.embroideryService.calculateQuote(body);
  }
}
