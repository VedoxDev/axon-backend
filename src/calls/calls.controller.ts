import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  Headers,
  RawBody,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CallsService } from './calls.service';
import { StartCallDto, JoinCallDto, UpdateCallParticipantDto } from './dto/call.dto';

@Controller('calls')
@UseGuards(AuthGuard('jwt'))
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  // ========== CALL MANAGEMENT ==========

  @Post('start')
  async startCall(@Request() req, @Body() startCallDto: StartCallDto) {
    return this.callsService.startCall(req.user, startCallDto);
  }

  @Post('join/:callId')
  async joinCall(
    @Request() req,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() joinCallDto?: JoinCallDto
  ) {
    return this.callsService.joinCall(req.user, callId, joinCallDto?.audioOnly);
  }

  @Post('join-debug/:callId')
  async joinCallDebug(
    @Request() req,
    @Param('callId') callId: string,  // No UUID validation
    @Body() joinCallDto?: JoinCallDto
  ) {
    console.log(`[DEBUG] Attempting to join call: "${callId}"`);
    try {
      return await this.callsService.joinCall(req.user, callId, joinCallDto?.audioOnly);
    } catch (error) {
      console.log(`[DEBUG] Join failed: ${error.message}`);
      return { error: error.message, callId };
    }
  }

  @Put('leave/:callId')
  async leaveCall(
    @Request() req,
    @Param('callId', ParseUUIDPipe) callId: string
  ) {
    return this.callsService.leaveCall(req.user, callId);
  }

  @Delete('end/:callId')
  async endCall(
    @Request() req,
    @Param('callId', ParseUUIDPipe) callId: string
  ) {
    return this.callsService.endCall(req.user, callId);
  }

  // ========== CALL QUERIES ==========

  @Get('active')
  async getActiveCalls(@Request() req) {
    return this.callsService.getUserActiveCalls(req.user);
  }

  @Get('debug/:callId')
  async debugCall(
    @Request() req,
    @Param('callId') callId: string  // No UUID validation for debugging
  ) {
    console.log(`[DEBUG] Received callId: "${callId}"`);
    console.log(`[DEBUG] CallId type: ${typeof callId}`);
    console.log(`[DEBUG] CallId length: ${callId.length}`);
    console.log(`[DEBUG] CallId chars: ${callId.split('').map(c => c.charCodeAt(0)).join(',')}`);
    
    // Try to find the call without UUID validation
    try {
      const call = await this.callsService.debugFindCall(callId);
      return { callId, found: !!call, call };
    } catch (error) {
      return { callId, error: error.message };
    }
  }

  @Get('history')
  async getCallHistory(
    @Request() req,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20
  ) {
    return this.callsService.getCallHistory(req.user, page, limit);
  }

  // ========== PARTICIPANT MANAGEMENT ==========

  @Put('participant/:callId')
  async updateParticipantState(
    @Request() req,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() updateDto: UpdateCallParticipantDto
  ) {
    return this.callsService.updateParticipantState(req.user, callId, updateDto);
  }

  // ========== TOKEN GENERATION ==========

  @Post('token/:callId')
  async generateToken(
    @Request() req,
    @Param('callId', ParseUUIDPipe) callId: string
  ) {
    // This endpoint allows regenerating tokens if needed
    const { call, token } = await this.callsService.joinCall(req.user, callId);
    return { token, roomName: call.roomName };
  }

  // ========== WEBHOOKS ==========

  @Post('webhook/livekit')
  async handleLiveKitWebhook(
    @RawBody() body: Buffer,
    @Headers('authorization') authHeader: string
  ) {
    await this.callsService.handleLiveKitWebhook(body, authHeader);
    return { status: 'ok' };
  }
} 